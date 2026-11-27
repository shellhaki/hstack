---
name: hstack-go-design
description: "Go design: constructors and functional options, avoiding init() and globals, resource lifecycle, timeouts, graceful shutdown, architecture sizing, project layout, manual dependency injection, and short sections for wire, dig, fx and samber/do. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: design, layout and dependency injection

Read this when you create a new Go package, service or project, pick a folder layout, or wire dependencies.
Match the structure the project already has. Add a pattern only when it solves a problem you can name.

## Rules

1. Match the project's existing architecture and DI approach. For a new project with no stated preference, ask once, then start flat and manual. A 100-line tool needs no layers and no DI library. Reason: structure you do not need is cost with no payoff.
2. Size the architecture to the code. Under about 500 lines: flat `main.go` plus a few files. 500 to 5,000 lines: simple layers (`handler/`, `service/`, `repository/`). Larger: clean, hexagonal or DDD only if the team wants it.
3. Keep the domain pure. Domain packages import no framework, DB driver or HTTP code. Infrastructure imports the domain, never the reverse. Reason: the domain stays testable without fakes of the world.
4. Validate at the boundary (HTTP handler, CLI parsing, message consumer), then trust the data inside. Do not re-validate at every layer.
5. Make illegal states unrepresentable. Use typed enums and constructor-checked types instead of raw strings.
6. Start enums at 1, or put an `Unknown` sentinel at 0. The zero value otherwise passes silently as the first member.
7. Prefer functional options for constructors with several optional settings: `NewServer(addr, opts...)`. Each option is a function, so adding one never breaks callers. If an option can be invalid, make `Option` return an error and fail in the constructor, not at run time. Use a builder only when steps need cross-validation.
8. Avoid `init()` and mutable package-level state. `init()` cannot return errors, runs before `main` and tests, and runs in filename order across files. Build things in explicit constructors. Compiled regexps (`regexp.MustCompile`) at package level are fine.
9. Return errors for anything a caller can handle. Panic only for impossible states, broken invariants and `Must*` helpers used at startup.
10. Call `defer x.Close()` right after the open succeeds. Later edits add return paths and skip distant cleanup. For write or flush resources where durability matters, check the close error instead of ignoring it.
11. Prefer `runtime.AddCleanup` (Go 1.24+) over `runtime.SetFinalizer`. Finalizers are unpredictable and can resurrect objects.
12. Put a timeout on every external call (`context.WithTimeout`, then `defer cancel()`). A slow upstream otherwise hangs the goroutine forever.
13. Bound everything: pool sizes, queue depths, buffers. Use a fixed-capacity channel for a pool. Unbounded resources grow until the process dies.
14. In retry loops, check `ctx.Err()` between attempts and wait with `select` on `ctx.Done()` plus a timer. Use backoff.
15. Stream large transfers (rows, files) with iterators (Go 1.23+) or `io` readers and writers. Do not load millions of rows into a slice.
16. Compile regexps once at package level, never inside a function that runs per call.
17. Use `[]byte` for I/O and mutation, `string` for keys and display. Each conversion allocates, so stay in one type.
18. Shut down gracefully: `signal.NotifyContext`, run the server in a goroutine, wait on `ctx.Done()`, call `Shutdown` with a timeout, then close DBs and queues.
19. Use `crypto/rand` for keys and tokens, never `math/rand`.
20. Prefer a small amount of your own code over a big dependency. Each dependency adds attack surface and upkeep.

### Layout

1. Put every `main` package under `cmd/<name>/`. `main.go` only parses flags, wires dependencies and calls `Run()`. Business logic lives in `internal/`.
2. Use `internal/` for private code. Use `pkg/` only if outsiders need to import it. A library keeps its public API in root-level packages and does not use `cmd/`.
3. Module path matches the repo URL, lowercase, hyphens for multiple words: `github.com/you/payment-processor`. Not `myproject`, not `MyProject`.
4. Package names are lowercase, singular and match the directory. Avoid `utils`, `helpers`, `common`. Do not create `src/` or a root-level `main.go`.
5. Put `_test.go` beside the code. Put fixtures in `testdata/`.
6. Use `go.work` only for several local modules that import each other. Single-module projects do not need it.
7. For services, follow 12-factor basics: config from environment, logs to stdout, stateless processes, graceful shutdown, one-off admin tasks as their own command (for example `cmd/migrate/`).

### Dependency injection

1. Inject dependencies through constructors. Never use globals or `init()` to set up services.
2. Define interfaces where they are consumed. Accept interfaces, return structs.
3. Fewer than 10 services: wire by hand in `main()`. No library needed.
4. Consider a DI library only at 10 to 20 or more services, or when you need lifecycle (health checks, ordered shutdown), lazy creation or scopes. If the project already uses one, keep using it. Never add one unless the brief asks.
5. The container exists only at the composition root. Never pass it into services (service locator). Services get the typed dependencies they need.
6. Keep the dependency graph shallow. Long chains (A to B to C to D to E) signal a design problem.
7. In tests, pass fakes through constructors. Mock at the interface boundary.

## Patterns

Functional options with defaults:

```go
type Option func(*Server)

func WithReadTimeout(d time.Duration) Option { return func(s *Server) { s.readTimeout = d } }

func NewServer(addr string, opts ...Option) *Server {
    s := &Server{addr: addr, readTimeout: 5 * time.Second, maxConns: 100}
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```

Typed enum with an invalid zero value:

```go
type Status int

const (
    StatusUnknown Status = iota // 0 = unset or invalid
    StatusActive
    StatusSuspended
)
```

Explicit construction instead of `init()`:

```go
func NewUserRepository(db *sql.DB) *UserRepository { return &UserRepository{db: db} }
```

Manual wiring in `main()`:

```go
func main() {
    logger := slog.Default()
    store := postgres.NewUserStore(connStr)
    userSvc := NewUserService(store, smtp.NewMailer(addr), logger)
    api := NewAPI(userSvc, logger)
    api.ListenAndServe(":8080")
}
```

Graceful shutdown:

```go
ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
defer stop()
srv := &http.Server{Addr: ":8080", Handler: router}
go func() {
    if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
        slog.Error("server", "error", err)
    }
}()
<-ctx.Done()
shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
_ = srv.Shutdown(shutdownCtx)
```

Fixed-size pool and compile-time interface check:

```go
conns := make(chan *Conn, maxSize) // bounded; Get selects on conns and ctx.Done()
var _ UserStore = (*PostgresStore)(nil)
```

## If the project uses google/wire

Wire generates plain constructor calls at build time. No runtime container, no reflection. The repo is archived (feature-complete).

- A provider is a plain function. It may return `(T, error)` or `(T, func(), error)` where the `func()` is cleanup. Wire chains cleanups in reverse order.
- Group providers with `wire.NewSet`. One small set per package.
- Declare interface bindings explicitly: `wire.Bind(new(UserStore), new(*PostgresRepo))`. Wire never infers them.
- Wire allows one provider per type. Give values of the same underlying type distinct named types (`type PrimaryDSN string`).
- Injector files start with `//go:build wireinject`. Without it the stub and the generated function collide.
- Run `wire ./...` after every constructor change, and `wire check ./...` as a fast CI check. Commit `wire_gen.go`. Never edit it.
- On error wire returns a nil cleanup. Guard it before `defer cleanup()`.
- Unit tests skip wire and call constructors directly.

## If the project uses uber-go/dig

Reflection-based container with no lifecycle. Constructors are lazy and memoized (one instance per container).

- `c.Provide(ctor)` registers. `c.Invoke(func(dep *T) error {...})` pulls. Check the error from every `Provide`.
- Group 4 or more dependencies in a struct embedding `dig.In`. Return several results from a struct embedding `dig.Out`. Tags: `name:"..."`, `optional:"true"`, `group:"..."`.
- Two providers of one type fail at `Provide`. Use `dig.Name("x")` and a `name:"x"` tag, or return a `dig.Out` struct.
- Value groups are unordered. If order matters, provide one explicit ordered slice.
- `dig.As(new(Iface))` exposes a concrete constructor as an interface.
- Test graph shape with `dig.New(dig.DryRun(true))` and an `Invoke` of the root. Dry run skips constructor execution.
- Never pass `*dig.Container` into services.

## If the project uses uber-go/fx

fx is dig plus lifecycle, modules and a signal-aware run loop. It suits long-running services.

- `fx.New(fx.Provide(...), fx.Invoke(...)).Run()` blocks until SIGINT or SIGTERM, then runs OnStop hooks in reverse order. Default start and stop timeout is 15 seconds.
- Constructors run only if something reaches them from an `fx.Invoke`. Add at least one Invoke.
- `OnStart` must return quickly. Start blocking work (such as `srv.Serve`) in a goroutine inside the hook. Respect `ctx.Done()`.
- Keep side effects out of constructors. Put them in `OnStart`.
- Use `fx.Supply` for pre-built values (config, flags). Use `fx.Annotate` for names, groups and `fx.As` instead of wrapper `fx.Out` structs.
- `fx.Module` scopes decorators to its own subtree. A top-level `fx.Decorate` is global.
- Test with `go.uber.org/fx/fxtest`: `fx.Populate(&target)` to extract values, `fx.Replace` to swap fakes. Check the production graph in CI with `fx.New(...).Err()`.

## If the project uses samber/do

Generics-based, no codegen, no reflection. Use v2 (`github.com/samber/do/v2`). v1 lacks scopes and lifecycle.

- `do.Provide(injector, func(i do.Injector) (T, error) {...})` is lazy. Also `ProvideValue`, `ProvideTransient`, `ProvideNamed`.
- Inside providers use `do.MustInvoke[T](i)`. The library recovers the panic at the outer `Invoke` and returns it as an error.
- `do.MustInvokeAs[Iface](injector)` resolves a concrete service by interface.
- Group registrations with `do.Package(...)` and `do.New(pkgA, pkgB)`.
- Lifecycle is by interface: `HealthCheck() error` and `Shutdown()` (several signatures). Call `injector.ShutdownOnSignalsWithContext` from `main`.
- Tests: `injector.Clone()` then `do.OverrideValue[Iface](clone, fake)`.
- Create one container per application. Use `injector.Scope("name")` for request-level isolation.

## Never

- Global `var db *sql.DB` set in `init()`. Pass it through a constructor.
- Depend on concrete types across layers. Accept an interface defined at the consumer.
- Pass the DI container into a service. Inject the specific dependencies.
- Put business logic in `cmd/`. Move it to `internal/`.
- Edit `wire_gen.go` by hand. Change providers and regenerate.
- Block inside an fx `OnStart`. Spawn a goroutine.
- Assume value-group order in dig, fx or wire. Provide an ordered slice.
- Make a package named `utils` or `common`. Name it for what it does.
- Pick a DI library or a heavy architecture for a small project. Stay manual and flat.
- Make an HTTP call without a timeout or context. Add `WithTimeout`.

## Check before you report

- `go build ./...` and `go vet ./...` pass.
- `go test ./...` passes. Run `go test -race ./...` for code with goroutines.
- `gofmt -l .` prints nothing.
- `grep -rn "func init()" --include=*.go .` shows no new service setup in `init()`.
- No new package-level mutable variables: `grep -rnE "^var [a-z]\w* (\*|=)" --include=*.go .` and review each hit.
- `ls cmd/*/` shows only entry points, and `main.go` files stay short.
- If wire is used: `wire ./...` leaves `git diff --stat` clean for `wire_gen.go`.
- If fx or dig is used: a test builds the production graph (`fx.New(...).Err()` or dig `DryRun`) and passes.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-design-patterns, golang-project-layout, golang-dependency-injection, golang-google-wire, golang-uber-dig, golang-uber-fx, golang-samber-do. https://github.com/samber/cc-skills-golang
