---
name: hstack-go-cli
description: "Go command-line tools: command tree and flags with cobra, layered config with viper (flag, env, file, default), exit codes, stdout vs stderr, signals, version stamping, shell completion and CLI tests. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: command-line tools

Read this when you build or change a Go CLI: commands, flags, config files, env vars, exit codes or CLI tests.
Follow the stack the project already uses (cobra, viper, urfave/cli or plain `flag`). A tiny single-purpose tool with no subcommands and few flags needs only the standard `flag` package.

## Rules

1. Keep `main.go` tiny: call `Execute()`, print the error, exit non-zero. Put one command per file under `cmd/<app>/`.
2. Set `SilenceUsage: true` and `SilenceErrors: true` on the root command. Otherwise every runtime error prints the full usage text. Print the error yourself, once. Full usage belongs to `--help`.
3. Use `RunE`, never `Run`. `Run` cannot return an error, so the only escape is `os.Exit` or panic, which skips defers.
4. Do not call `os.Exit` inside `RunE` or library code. Return an error. Only `main()` decides the exit code, so cleanup and deferred calls run.
5. Exit codes: `0` success, `1` runtime failure, `2` usage error (bad flags or args), `64-78` BSD sysexits if you need categories, `128+N` for death by signal N (130 for SIGINT). Map error types to codes in `main()` with `errors.As` on a small `ExitError{Code, Err}` type.
6. Validate positional arguments with the `Args` field (`cobra.ExactArgs(1)`, `NoArgs`, `MinimumNArgs`, `RangeArgs`, `MatchAll(...)`, or a custom func). Do not write `len(args)` checks in `RunE`. Cobra's own errors then stay consistent.
7. Persistent flags (`PersistentFlags()`) go to all subcommands. Local flags (`Flags()`) belong to one command. Constrain flags with `MarkFlagRequired`, `MarkFlagsMutuallyExclusive`, `MarkFlagsOneRequired`.
8. Hook order is `PersistentPreRunE`, `PreRunE`, `RunE`, `PostRunE`, `PersistentPostRunE`. Always use the `E` forms. `PostRunE` runs only if `RunE` succeeded.
9. A child's `PersistentPreRunE` replaces the parent's. It does not chain. Call `parent.PersistentPreRunE(cmd, args)` from the child if you need both.
10. Initialize config in the root `PersistentPreRunE`. It runs before every subcommand.
11. Register command groups (`AddGroup`) before the `AddCommand` calls that reference them. Cobra does not assign groups afterwards.
12. Output discipline: program output (the data a pipe consumes) goes to stdout. Logs, progress and errors go to stderr. Logs on stdout corrupt the next program's input.
13. Write through `cmd.OutOrStdout()` and `cmd.ErrOrStderr()`, not `os.Stdout`. Tests can then capture output.
14. Offer `--output table|json|plain` for commands scripts may parse. Colors must turn off when stdout is not a terminal (`fatih/color` does this).
15. Use `signal.NotifyContext` for Ctrl-C and SIGTERM. Pass the context to `ExecuteContext` or into the work, so cancellation propagates.
16. Inject the version at build time with `-ldflags "-X main.version=..."`, from git tags. Do not hardcode a version string. The `-X` path is the package path of the variable (`main` for package main).

### Viper config layering

17. Precedence, high to low: explicit `Set()`, flag, env var, config file, remote KV, default. The order is fixed. A flag overrides only when the user set it. Its default value ranks last.
18. Wire env binding as three things together: `SetEnvPrefix("MYAPP")`, `SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))`, `AutomaticEnv()`. Without the replacer, `database.host` looks for `MYAPP_DATABASE.HOST` and never matches. Without the prefix, `PORT` collides with other tools.
19. A missing config file is not an error. Check `errors.As(err, &notFound)` with `var notFound viper.ConfigFileNotFoundError` (a value type) and return only other errors. A config file must stay optional so flag-only and env-only runs work.
20. Bind every configurable flag with `viper.BindPFlag` (or `BindPFlags`) in `init()` or `PersistentPreRunE`, before any `viper.Get*` on that key. Never bind in `RunE`: it is too late.
21. Unmarshal into a struct with explicit `mapstructure` tags on every field, including nested ones. Implicit matching silently misses underscore and nested names. Prefer `UnmarshalKey("database", &dbCfg)` over `Sub("database")`: `Sub` returns nil when the key is missing.
22. Secrets come from env vars or a secret manager, never from the config file or defaults in code.
23. `WatchConfig` uses fsnotify on inodes. Editors that save by rename (vim) can stop the callback from firing. Test reload with `echo >> config.yaml`. Guard config you update from `OnConfigChange` with a mutex, because it runs in another goroutine.
24. In tests, use `viper.New()` per test and pass the `*viper.Viper` into code, not the global. The global leaks state between tests. Use `t.Setenv` for env.

## Patterns

Root command:

```go
var rootCmd = &cobra.Command{
    Use:           "myapp",
    Short:         "One-line summary",
    SilenceUsage:  true,
    SilenceErrors: true,
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error { return initConfig() },
}

func main() {
    ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer stop()
    if err := rootCmd.ExecuteContext(ctx); err != nil {
        fmt.Fprintln(os.Stderr, "error:", err)
        var ee *ExitError
        if errors.As(err, &ee) {
            os.Exit(ee.Code)
        }
        os.Exit(1)
    }
}
```

Config init with the three env settings and an optional file:

```go
func initConfig() error {
    if cfgFile != "" {
        viper.SetConfigFile(cfgFile)
    } else {
        viper.SetConfigName(".myapp")
        viper.AddConfigPath(".")
        viper.AddConfigPath("$HOME")
    }
    viper.SetEnvPrefix("MYAPP")
    viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))
    viper.AutomaticEnv()
    if err := viper.ReadInConfig(); err != nil {
        var notFound viper.ConfigFileNotFoundError
        if !errors.As(err, &notFound) {
            return fmt.Errorf("reading config: %w", err)
        }
    }
    return nil
}
```

Flag defined and bound to viper:

```go
serveCmd.Flags().Int("port", 8080, "listen port")
_ = viper.BindPFlag("port", serveCmd.Flags().Lookup("port"))
```

Subcommand with arg validation and testable output:

```go
var getCmd = &cobra.Command{
    Use:  "get <id>",
    Args: cobra.ExactArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        _, err := fmt.Fprintln(cmd.OutOrStdout(), "fetching", args[0])
        return err
    },
}
```

Typed config:

```go
type Config struct {
    Port     int    `mapstructure:"port"`
    LogLevel string `mapstructure:"log-level"`
    Database struct {
        DSN     string `mapstructure:"dsn"`
        MaxConn int    `mapstructure:"max-conn"`
    } `mapstructure:"database"`
}
```

Exit-code error type and CLI test (fresh tree per test):

```go
type ExitError struct {
    Code int
    Err  error
}

func (e *ExitError) Error() string { return e.Err.Error() }
func (e *ExitError) Unwrap() error { return e.Err }

func TestGet(t *testing.T) {
    cmd := newRootCmd() // build a new tree: cobra keeps flag state between Execute calls
    buf := new(bytes.Buffer)
    cmd.SetOut(buf)
    cmd.SetArgs([]string{"get", "42"})
    if err := cmd.Execute(); err != nil {
        t.Fatal(err)
    }
    if !strings.Contains(buf.String(), "42") {
        t.Fatalf("got %q", buf.String())
    }
}
```

## If the project uses cobra

- Completions come free for bash, zsh, fish and PowerShell. Add `ValidArgs` (static), `ValidArgsFunction` (dynamic) and `RegisterFlagCompletionFunc` for flag values. Return `cobra.ShellCompDirectiveNoFileComp` when your list is complete, so the shell does not add file names.
- Cobra handles the command tree only. It does no config layering. Use cobra alone for flag-only tools.
- Docs and man pages come from `cobra/doc` generators.

## If the project uses viper

- Viper only resolves values. It defines no commands or flags. Use it alone for config-file daemons.
- Supported file formats include JSON, TOML, YAML, HCL, INI and properties. `MergeInConfig` layers a second file over the first.
- For `time.Duration`, `net.IP` and slices use the default decode hooks, or register a custom `DecodeHook`.

## Never

- `os.Exit(1)` inside `RunE`. Return the error and exit in `main()`.
- `Run:` instead of `RunE:`. Switch to `RunE`.
- `fmt.Println` or `os.Stdout` in a command. Use `cmd.OutOrStdout()`.
- Log or progress text on stdout. Send it to stderr.
- Require a config file. Treat `ConfigFileNotFoundError` as normal.
- Use viper's global in tests. Create `viper.New()` per test.
- Reuse one root command across tests. Build a fresh tree each time.
- Add `viper.AutomaticEnv()` alone. Also set the prefix and the key replacer.
- Bind flags in `RunE`. Bind in `init()` or `PersistentPreRunE`.
- Hardcode a version. Stamp it with `-ldflags`.
- Print the usage wall on every error. Keep `SilenceUsage: true`.

## Check before you report

- `go build ./...`, `go vet ./...` and `go test ./...` pass.
- `go run ./cmd/<app> --help` lists your command and flags. `go run ./cmd/<app> <cmd> --bogus; echo $?` prints a short error and a non-zero code, not a usage wall.
- Stdout is clean: `go run ./cmd/<app> <cmd> 2>/dev/null` shows only the data, and `>/dev/null` shows only diagnostics.
- Config layers work: run once with a flag (`--port 9090`), once with `MYAPP_PORT=9090`, once with a config file, and once with nothing. Each gives the expected value, and the no-config-file run does not crash.
- `grep -rn "os.Exit" --include=*.go .` hits only `main()`.
- `grep -rn "Run: " --include=*.go cmd` shows no non-`E` hooks.
- Version stamping: `go build -ldflags "-X main.version=1.2.3" -o /tmp/app ./cmd/<app> && /tmp/app version` prints `1.2.3`.
- If you added completions, `<app> completion bash | head` produces a script.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-cli, golang-spf13-cobra, golang-spf13-viper. https://github.com/samber/cc-skills-golang
