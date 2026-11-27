---
name: hstack-go-concurrency
description: "Go goroutine lifecycle, channels and select, sync primitives, errgroup, worker pools, pipelines, and context.Context (cancellation, timeouts, values, HTTP and DB propagation). Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: concurrency and context

Read this before you write or review code that starts goroutines, uses channels or locks, shares state, or takes a `context.Context`.
Treat every goroutine as a liability until you can say how it stops.

## Rules

Goroutines
1. Know how every goroutine exits before you write `go`. Use context cancellation, a closed channel, or a done signal. Otherwise it leaks.
2. Make sure you can wait for it (`WaitGroup` or `errgroup`). Fire-and-forget goroutines outlive shutdown.
3. Do not add concurrency without a measured need. Synchronous code is easier to get right.
4. Recover from panics at goroutine boundaries in production code. A panic in any goroutine kills the whole process.
5. Call `wg.Add` before the `go` statement, never inside the goroutine. `Wait` may return early otherwise.
6. Go 1.25+: `wg.Go(func(){...})` replaces `Add`/`Done` for simple work that returns no error and does not panic. Before 1.25, use `Add`/`Done`.
7. Loop variables are per-iteration from Go 1.22 (module `go` directive 1.22+). Do not add `item := item` there.

Channels and select
8. Only the sender closes a channel (`defer close(out)` in the producer). Closing from the receiver panics if the sender writes later.
9. Declare direction in signatures (`chan<- T`, `<-chan T`). The compiler then blocks misuse.
10. Default to unbuffered. Use buffer 1 for signal channels. Use N > 1 only with a measured reason, written in a comment, because big buffers hide backpressure.
11. Every blocking send or receive in a goroutine selects on `ctx.Done()`. Otherwise it leaks after the caller cancels.
12. Send copies or immutable values, not pointers to shared mutable data. A pointer makes hidden shared memory.
13. Check the `ok` value when you receive in a loop, so a closed channel ends the loop.
14. Do not call `time.After` in a hot loop. Each call allocates a timer. Reuse `time.NewTimer` plus `Reset`.
15. Timer reuse: Go 1.23+ (module `go` 1.23+) guarantees no stale value in `timer.C` after `Stop`. Before that, drain `timer.C` if `Stop` returns false.

Choosing a tool
16. Channel: pass data or ownership, coordinate lifecycle. Mutex: protect struct fields. Atomic: simple counters and flags. `sync.Once`/`singleflight`: compute once or dedupe.
17. Never read and write a plain map from several goroutines. It is a hard crash, not just a race.
18. `sync.Mutex`: keep the critical section short. Never hold it across I/O, network calls, or channel operations.
19. Put the mutex field directly above the fields it protects, unexported, with a comment.
20. `sync.RWMutex`: never upgrade `RLock` to `Lock` while holding it. That deadlocks. Release, then take the write lock.
21. Prefer typed atomics (Go 1.19+): `atomic.Int64`, `atomic.Bool`, `atomic.Pointer[T]`.
22. `sync.Map` only for write-once/read-many keys or disjoint key sets per goroutine. Otherwise, and whenever you need iteration or a length, use `map` plus `RWMutex`.
23. `sync.Pool`: call `Reset()` before `Put()`. `Get()` may return a dirty object. The GC may drop pooled objects at any time, so never store state in them.
24. `sync.Once` for one-time init. Go 1.21+ has `OnceFunc`, `OnceValue`, `OnceValues`.
25. `singleflight.Group.Do` stops duplicate concurrent loads of one key (cache stampede).

Groups, pools, pipelines
26. Use `errgroup.WithContext` when siblings must stop on the first error. Use `g.SetLimit(n)` to bound concurrency. It replaces most hand-written worker pools.
27. Writing to `results[i]` from goroutine `i` is safe. Writing to a shared slice or map is not.
28. Hand-roll a worker pool only for per-worker state, custom priority or backpressure, or draining in-flight work.
29. Pipeline stage rule: the stage that creates an output channel closes it, and every send selects on `ctx.Done()`.
30. Fan-in and fan-out: close the merged output in a separate goroutine that runs after `wg.Wait()`.
31. For sequential in-process transforms, use Go 1.23+ iterators (`iter.Seq`) instead of goroutines and channels.

Context
32. `ctx context.Context` is the first parameter, named `ctx`.
33. Pass the same context down the whole call chain (handler to service to DB to client). A fresh `context.Background()` mid-request ignores the caller's deadline and cancel.
34. Do not store a context in a struct. It outlives the request and goes stale.
35. Create `context.Background()` only at entry points (main, init, tests). Use `context.TODO()` as a marked placeholder. Never pass a `nil` context.
36. Call `cancel()` on every path for `WithCancel`, `WithTimeout`, `WithDeadline`. Use `defer cancel()` right after creating it, unless you return the context and cancel together. A missed cancel leaks the child and its timer.
37. A child cannot outlive its parent's deadline. The shorter deadline always wins.
38. In CPU-bound loops, check `ctx.Err()` periodically. In waiting code, select on `ctx.Done()` and return `ctx.Err()`.
39. In HTTP handlers use `r.Context()`. It is cancelled when the client disconnects. Do not create `Background()` inside a handler.
40. Use context-aware calls: `http.NewRequestWithContext`, `QueryContext`, `ExecContext`, `QueryRowContext`.
41. Go 1.21+: `context.WithoutCancel(ctx)` keeps values (trace id) but detaches cancellation, for work that must outlive the request (audit log). `context.AfterFunc` runs a callback in a new goroutine on cancel.
42. Context keys are unexported types, never plain `string`. Wrap access in `WithX`/`XFromContext` helpers.
43. Context values carry request-scoped metadata only (trace, request, user or tenant id). Never pass function arguments, config, feature flags, or DB handles that way. Values lose type checking and hide inputs.

## Patterns

Goroutine with a clean exit and a wait handle:
```go
func start(ctx context.Context) *sync.WaitGroup {
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
        for {
            select {
            case <-ctx.Done():
                return
            default:
                doWork(ctx)
            }
        }
    }()
    return &wg
}
```

Producer that closes its own channel and never blocks past cancel:
```go
func generate(ctx context.Context) <-chan int {
    ch := make(chan int)
    go func() {
        defer close(ch)
        for i := 0; ; i++ {
            select {
            case ch <- i:
            case <-ctx.Done():
                return
            }
        }
    }()
    return ch
}
```

Bounded, first-error-cancels fan-out:
```go
g, ctx := errgroup.WithContext(ctx)
g.SetLimit(10)
for _, t := range tasks {
    g.Go(func() error { return process(ctx, t) })
}
if err := g.Wait(); err != nil {
    return err
}
```

Reusable timer in a select loop (Go 1.23+):
```go
timer := time.NewTimer(5 * time.Second)
defer timer.Stop()
for {
    select {
    case msg := <-ch:
        timer.Reset(5 * time.Second)
        handle(msg)
    case <-timer.C:
        handleTimeout()
        timer.Reset(5 * time.Second)
    }
}
```

Timeout with cancel, and a detached background task:
```go
ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
defer cancel()
go audit(context.WithoutCancel(r.Context()), order) // outlives the request
```

Typed context key:
```go
type ctxKey string
const traceIDKey ctxKey = "trace_id"

func WithTraceID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, traceIDKey, id)
}
func TraceID(ctx context.Context) (string, bool) {
    id, ok := ctx.Value(traceIDKey).(string)
    return id, ok
}
```

Dedupe concurrent loads:
```go
v, err, _ := group.Do(id, func() (any, error) { return db.QueryUser(ctx, id) })
```

## Never

- Fire-and-forget `go func(){ for { ... } }()`. Give it a context and a `WaitGroup`.
- Closing a channel from the receiver. Let the sender close it.
- `select` with no `ctx.Done()` case. Add one.
- `wg.Add(1)` inside the goroutine. Move it before `go`.
- `time.After` inside a loop. Reuse a `Timer`.
- One goroutine per item with no limit. Use `errgroup.SetLimit` or a semaphore channel.
- Holding a mutex while calling the network, disk, or sending on a channel. Copy what you need, unlock, then do the slow work.
- `ctx, _ := context.WithTimeout(...)`. Keep `cancel` and `defer` it.
- `context.Background()` inside a request path. Pass `ctx` through.
- `context.WithValue(ctx, "user", u)`. Use an unexported key type.
- Spawning `go` with the request `ctx` for work that must outlive the request. Use `WithoutCancel`.
- Sharing a pointer through a channel and then mutating it. Send a copy.

## Check before you report

- `go vet ./...` (catches copied locks and lost cancels).
- `go test -race ./...` on every package that starts goroutines. Never skip `-race` in CI.
- `golangci-lint run` if configured (`govet`, `staticcheck`, `containedctx`, `noctx` where enabled).
- `grep -rn "go func\|go [a-z]" --include=*.go` and confirm each spawn has an exit path and a wait.
- `grep -rn "time.After(" --include=*.go` and confirm none sit in loops.
- `grep -rn "context.Background()\|context.TODO()" --include=*.go` and confirm each is at an entry point or a marked placeholder.
- If goroutines are started in tests, add `goleak.VerifyTestMain(m)` (`go.uber.org/goleak`) in `TestMain`.
- Every `With*` context call is followed by `defer cancel()`.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-concurrency, golang-context. https://github.com/samber/cc-skills-golang
