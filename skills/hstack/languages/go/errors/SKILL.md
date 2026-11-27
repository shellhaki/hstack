---
name: hstack-go-errors
description: "Go error handling: creating, wrapping, inspecting, joining, logging and panicking, plus structured errors with samber/oops. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: errors

Read this when you create, wrap, check, log or return errors in Go, or when you review code that does.
Every error is either handled or returned with context. A silent failure and a duplicate log line are equally wrong.

## Rules

### Create

1. Check every returned error. Never discard one with `_`, and never use the other return values before checking `err`.
2. Write error strings in lowercase with no trailing punctuation, and do not repeat context the wrapper will add: `"connection refused"`, then `fmt.Errorf("fetching user: %w", err)`.
3. Use `errors.New` as a package-level variable (a sentinel, named `ErrX`) when callers must match a condition. Use a custom type when callers need data from the error. Use plain `fmt.Errorf` for errors nobody matches on.
4. Give a custom error type an `Error()` method on a pointer receiver, and an `Unwrap() error` method when it holds another error. Without `Unwrap`, `errors.Is` and `errors.As` cannot see through it.
5. Keep the message static where logs are grouped by message (Datadog, Loki, Sentry). Put IDs, paths, line numbers and counts in structured attributes, not in the message. A fixed wrap prefix such as `"fetching user"` is fine.

### Wrap and inspect

6. Wrap with `fmt.Errorf("context: %w", err)` at each layer, so the chain reads `creating order: charging card: connection refused`. Add context at least once per package boundary.
7. Use `%w` inside your module. Use `%v` at a public API boundary when callers must not depend on your internal error types.
8. Match sentinels with `errors.Is(err, ErrX)`, never `err == ErrX`. Direct comparison fails on wrapped errors.
9. Extract typed errors with `errors.As(err, &target)`. On Go 1.26+, prefer `errors.AsType[*T](err)` when `T` implements `error`. Keep `errors.As` for older Go or non-error interface targets. Never use a bare `err.(*T)`.
10. Combine independent errors with `errors.Join` (Go 1.20+). It returns nil for an empty or all-nil list, and `errors.Is` and `errors.As` work on each inner error.
11. Return an untyped `nil` for success. A function that returns `error` must never return a nil `*MyErr`: the interface is then non-nil (see the safety skill).

### Handle once

12. Handle an error once: log it or return it, never both. Doing both makes duplicate log lines.
13. Log only at the top: `main`, an HTTP handler, a worker loop. Lower layers add context and return.
14. Use `slog` (Go 1.21+) with the error as an attribute: `slog.Error("order failed", "error", err)`. Do not use `fmt.Println` or `log.Printf`.
15. Pick log levels by severity. Log HTTP requests in middleware with method, path, status and duration.
16. Never show internal errors to users. Log the technical detail, and send a safe generic message (`"internal error"`, status 500).

### Panic

17. Panic only for programmer errors, impossible states and broken invariants, such as a `Must...` helper failing at startup. Never panic for timeouts, missing files or bad input.
18. Recover in a deferred function at goroutine boundaries (HTTP middleware, worker goroutines), so one panic does not kill the process. Log the panic value and `debug.Stack()`.
19. A `recover()` only works in the goroutine that panicked. Each goroutine you start needs its own recover if a panic there must not crash the program.

## Patterns

```go
// Wrap, return, do not log (rules 6, 12).
func processOrder(id string) error {
    if err := chargeCard(id); err != nil {
        return fmt.Errorf("charging card: %w", err)
    }
    return nil
}

// Log once, at the boundary (rules 13, 16).
func handleOrder(w http.ResponseWriter, r *http.Request) {
    if err := processOrder(r.FormValue("id")); err != nil {
        slog.Error("order failed", "error", err)
        http.Error(w, "internal error", http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusOK)
}

// Sentinel plus typed error with Unwrap (rules 3, 4).
var ErrNotFound = errors.New("mypkg: not found")

type QueryError struct {
    Query string
    Err   error
}

func (e *QueryError) Error() string { return fmt.Sprintf("query %q: %v", e.Query, e.Err) }
func (e *QueryError) Unwrap() error { return e.Err }

// Inspect through the chain (rules 8, 9).
if errors.Is(err, sql.ErrNoRows) {
    return nil, ErrNotFound
}
var qe *QueryError
if errors.As(err, &qe) {
    slog.Warn("query failed", "query", qe.Query)
}

// Break the chain at a public boundary (rule 7).
return fmt.Errorf("item unavailable: %v", err)

// Collect several failures (rule 10).
func closeAll(cs ...io.Closer) error {
    var errs []error
    for _, c := range cs {
        if err := c.Close(); err != nil {
            errs = append(errs, err)
        }
    }
    return errors.Join(errs...)
}

// Low-cardinality log: static message, variable data as attributes (rule 5).
slog.Error("csv parsing failed", "error", err, "csv_file_path", path, "csv_file_line", line)

// Recover at a handler boundary (rule 18).
defer func() {
    if rec := recover(); rec != nil {
        slog.Error("panic recovered", "panic", rec, "stack", string(debug.Stack()))
        http.Error(w, "internal error", http.StatusInternalServerError)
    }
}()
```

## If the project uses samber/oops

Use it only when the repo already imports `github.com/samber/oops`, or the user asks for stack traces and structured error context. Do not add it on your own.

1. Build errors with a fluent chain that ends in `.Errorf(...)`, `.Wrap(err)`, `.Wrapf(err, ...)`, `.Join(...)` or `.Recover(fn)`.
2. Put variable data in `.With("key", v)`, not in the message. Other builder methods: `.In("domain")`, `.Tags(...)`, `.Code("slug")`, `.User(id, ...)`, `.Tenant(id, ...)`, `.Trace(id)`, `.Hint(...)`, `.Owner(...)`, `.Request(r, false)`.
3. `oops.Wrap` and `Wrapf` return nil when `err` is nil, so call them without an `if err != nil` guard when you only wrap.
4. Add context once per package boundary, not at every call.
5. Set `.Public("safe text")` for user-facing text, and read it back with `oops.GetPublic(err, "fallback")`. Never send the full error to users.
6. Use `oops.Recover(func(){...})` at goroutine boundaries to turn a panic into a structured error.
7. Reuse a builder (`builder := oops.In("svc").Tenant(...)`) across a function, or carry one in the context with `oops.WithBuilder(ctx, b)` and `oops.FromContext(ctx)`.
8. oops errors work with `errors.Is`, `errors.As` and `slog.Any("error", err)`. `%+v` prints the stack trace, and `json.Marshal(err)` gives JSON. Read fields through `err.(oops.OopsError)` (`Code()`, `Domain()`, `Tags()`, `Context()`, `Stacktrace()`).
9. `oops.Assert` and `Assertf` panic, so use them only for impossible states and inside `Recover`.

```go
return oops.
    In("order-service").
    Code("order_insert_failed").
    User(req.UserID).
    With("order_id", req.Order.ID).
    Wrapf(err, "inserting order")
```

## Never

- `data, _ := os.ReadFile(p)`: handle the error.
- `log.Printf(...)` then `return err` for the same error: do one of them.
- `if err == ErrX` or `err.(*MyErr)`: use `errors.Is` and `errors.As`.
- `fmt.Errorf("... %v", err)` inside your module: use `%w` so callers can inspect it.
- `fmt.Errorf("user %s not found in tenant %s", ...)` in grouped production logs: static message, IDs as attributes.
- `errors.New("Failed to connect.")`: lowercase, no period.
- `panic(err)` for a failed lookup or network call: return the error.
- `var e *MyErr; return e` from a function returning `error`: return `nil`.
- Sending `err.Error()` to an HTTP client: send a generic message and log the detail.

## Check before you report

- `go vet ./...` is clean.
- `golangci-lint run` has no `errcheck` hits. Also useful: `errorlint` (wrapping and comparison), `nilerr`, `staticcheck`, `errname`.
- Grep the diff for `, _ :=`, `, _ =`, `err ==`, `err.(` and `%v", err`: each hit is deliberate.
- Search each function that logs an error for a `return` of the same error.
- Every `go func()` you added has a recover where a panic must be contained.
- Tests assert errors with `errors.Is` or `errors.As`, not string comparison.
- `go test -race ./...` passes.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-error-handling, golang-samber-oops. https://github.com/samber/cc-skills-golang
