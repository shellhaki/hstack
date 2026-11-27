---
name: hstack-go
description: "Go (Golang): the rules a strong Go engineer applies, routed by topic. Part of the hstack skill: loaded through ROUTES.md whenever the task touches Go code, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go

Read this when the task touches `.go` files, `go.mod` or `go.work`. It adds Go specifics to the general
guides; it doesn't replace them (`think/` and `engineering/` still apply).

## Always, on any Go task
1. **Find the Go version** in `go.mod` (`go 1.xx`) and use only features it has.
2. **Follow the project's own choices** (router, logger, DI, test helpers, linters). Read
   `.golangci.yml`, `Makefile` and two neighbouring packages before writing new code.
3. **Errors are values:** handle or return every error, wrap with context using `%w`, never ignore one
   with `_` unless the reason is in a comment.
4. **Every goroutine has an owner and an end:** who stops it, how (context cancel, closed channel), and
   who waits for it.
5. **`context.Context` is the first parameter** of anything that does I/O or may block, and it is
   passed down, never stored in a struct.
6. **Run the checks:** `gofmt -l .` (empty), `go vet ./...`, `go test -race ./...`, and
   `golangci-lint run` if the project has a config.

## Topics: read the ones the task touches (often several)

| The task involves | Read | Also read |
|---|---|---|
| Naming, formatting, structs, interfaces, newer language features | `style/SKILL.md` | |
| Creating, wrapping, checking or logging errors | `errors/SKILL.md` | `safety/SKILL.md` for nil-heavy code |
| Nil, maps, slices aliasing, typed-nil interfaces, integer overflow, panics | `safety/SKILL.md` | |
| Goroutines, channels, `sync`, `select`, cancellation, timeouts, `context` | `concurrency/SKILL.md` | `safety/SKILL.md` |
| Slices, maps, generics, pointers, choosing a container | `data-structures/SKILL.md` | |
| Writing or fixing tests, table tests, fuzzing, mocks, testify | `testing/SKILL.md` | |
| Slow code, allocations, profiling, benchmarks, pprof | `performance/SKILL.md` | measure before changing |
| A panic, race, deadlock, leak or wrong result you can't explain | `debug/SKILL.md` | `concurrency/SKILL.md` if goroutines are involved |
| Logging, metrics, tracing, `log/slog` | `observability/SKILL.md` | `errors/SKILL.md` |
| Input handling, auth, crypto, secrets, templates, files, exec | `security/SKILL.md` | `safety/SKILL.md` |
| SQL, `database/sql`, transactions, scanning, connection pools | `database/SKILL.md` | `security/SKILL.md`, `errors/SKILL.md` |
| Package layout, constructors, options, dependency injection (wire, dig, fx, do) | `design/SKILL.md` | `style/SKILL.md` |
| gRPC, GraphQL, OpenAPI/Swagger | `apis/SKILL.md` | `errors/SKILL.md`, `testing/SKILL.md` |
| A command-line tool, cobra, viper, flags and config | `cli/SKILL.md` | |
| Linters, gopls, go.mod and dependencies, CI, godoc, choosing a library | `tooling/SKILL.md` | |
| Renaming, moving, splitting packages, changing exported APIs | `refactor/SKILL.md` | `style/SKILL.md`, `engineering/refactor/SKILL.md` |
| Code that already uses samber/lo, mo, ro or hot | `libraries/SKILL.md` | |

Log each topic you read as a ROUTE line, like any other guide (`ROUTES.md`).

## Before you report (Go)
```
GOFMT: gofmt -l . → <empty>
VET: go vet ./... → <ok>
TESTS: go test -race ./... → <pass/fail counts vs baseline>
LINT: golangci-lint run → <ok | not configured>
VULN: govulncheck ./... → <ok | not installed>   (when dependencies or security-relevant code changed)
```

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe), commit d68d80a; see `NOTICE.md`.
https://github.com/samber/cc-skills-golang
