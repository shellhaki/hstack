---
name: hstack-go-debug
description: "Go debugging specifics: reading panics and stack traces, the race detector, goroutine dumps, deadlocks and leaks, Delve, GODEBUG and pprof capture, flaky tests, and the common Go root causes. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: debug

Read this when Go code panics, hangs, races, leaks, gives a wrong result, or a build fails.
It adds Go tools and root causes to the general debug guide (reproduce, one hypothesis, root cause, failing test, fix).

## Rules

Reading the failure
1. Read the whole error first. The file and line are exact. In a panic trace, find the first frame in your code and skip `runtime.*` and `panic(...)` frames.
2. Know the common messages. `invalid memory address or nil pointer dereference` is a nil pointer. `assignment to entry in nil map` is a write to an uninitialized map. `index out of range [i] with length n` is a bounds error. `interface conversion: interface {} is string, not int` is a failed type assertion without comma-ok. `send on closed channel` is a send after `close`. `all goroutines are asleep - deadlock!` is a total deadlock (fatal, not a panic).
3. `fatal error: concurrent map read and map write` cannot be caught by `recover()` and kills the process. It is always a missing lock. Run `go test -race`.
4. `GOTRACEBACK=all` prints every goroutine on a panic (`single` is the default, `system` adds runtime frames, `none` prints nothing). Use `all` for hangs and crashes.
5. A `recover()` only catches panics in its own goroutine. A panic in any other goroutine kills the process, so each goroutine needs its own deferred recover.
6. A build error is precise: `undefined` means check imports, export case and build tags. `cannot use X as Y` means concrete type versus interface. Run `go build ./... 2>&1` and `go vet ./...` for the full list.
7. Module and build failures: `go mod tidy`, `go mod why <pkg>`, `go mod verify`, `go clean -modcache`. Check `go version` against the `go` line in `go.mod`, and `go env CGO_ENABLED` for cgo.
8. Use `go doc`, not `go tool doc` (removed in Go 1.26).

Reproduce and isolate
9. Write the failing test before the fix. Narrow it: `go test -run TestX -count=1 -v ./pkg/...` (`-count=1` bypasses the cache). Add table cases at the suspected boundary (empty, negative, zero, overflow, whitespace).
10. Find the breaking commit with `git bisect`.
11. Flaky test: run `go test -count=100 -failfast -run TestX`, then `-shuffle=on` (order dependence) and `-parallel 1` (parallelism). Typical causes: shared package state (reset in `TestMain` or `t.Cleanup`), `time.Sleep` instead of synchronization, fixed ports (listen on port 0), shared directories (use `t.TempDir()`).
12. Find a hang with `go test -timeout 10s`. The timeout panic dumps every goroutine.
13. Trace data backwards to where the bad value was created and fix it there, not where it crashed. For example, validate in `NewServer`, do not nil-check in every handler.
14. When you cannot find the caller, add temporary `fmt.Fprintf(os.Stderr, "...%s", debug.Stack())` and remove it afterwards. In production code use `slog`, never `fmt.Println`.
15. After three failed fixes, stop. The mental model is wrong. Re-read the code and trace the data flow from scratch.

Races, deadlocks, leaks
16. Run `go test -race ./...` always, and in CI. It slows code about 10x and only finds races on paths that actually ran. A clean run is not proof, so write a test that exercises the concurrent path. Fix with a lock, channel or atomic, never a sleep.
17. Read a race report as two stacks: `Write at ... by goroutine N` and `Previous read at ... by goroutine M`, each followed by `Goroutine N created at`. Find the one variable both stacks touch and put a lock, channel or atomic around it.
18. Dump goroutines: `curl 'localhost:6060/debug/pprof/goroutine?debug=2'`, `kill -QUIT <pid>` (dumps and exits), or `runtime.Stack(buf, true)`. Look for many goroutines at the same line and for long waits such as `[chan receive, 45 minutes]`, `[semacquire]`, `[sync.Mutex.Lock]`.
19. Deadlock causes: circular wait (A needs B, B needs A), a sender or receiver that already exited, locks taken in different orders. Always take locks in one fixed order. The runtime reports a deadlock only when all goroutines are blocked, so a partial deadlock needs a dump.
20. Goroutine leak signs: `runtime.NumGoroutine()` or `go_goroutines` grows with no traffic growth. Find them with the goroutine dump, `go.uber.org/goleak` in tests (`goleak.VerifyTestMain(m)`), or the `goroutineleak` profile (generally available in Go 1.27; experimental behind `GOEXPERIMENT=goroutineleakprofile` in 1.26).
21. Usual leak causes: a loop reading a channel that never closes with no `ctx.Done()` case, a missing `resp.Body.Close()`, `time.After` in a loop (use one `time.NewTicker` and `defer Stop()`), `wg.Add(1)` inside the goroutine, a `context.WithTimeout` whose `cancel` is never called.
22. Capture before you restart a sick production process: goroutine dump (`?debug=2`), heap, 30 s CPU, mutex. Then analyze offline with `go tool pprof`.
23. pprof endpoints leak memory contents and can be used to DoS you. Bind to localhost or protect them with auth (`subtle.ConstantTimeCompare`), and enable by env var. Mutex and block profiles need `runtime.SetMutexProfileFraction(n)` and `runtime.SetBlockProfileRate(n)` first.

Delve and runtime flags
24. Start simple: a test and a log line. Escalate to Delve for state you cannot print, then to pprof, trace or GODEBUG for performance questions.
25. Delve: `dlv test ./pkg -- -test.run TestX`, `dlv debug ./cmd/app`, `dlv exec ./bin -- --flag=v`, `dlv attach <pid>`. Inside: `break file.go:42`, `continue`, `next`, `step`, `stepout`, `print x`, `locals`, `args`, `stack`, `goroutines`, `goroutine 5`. Build with `-gcflags='all=-N -l'` when you debug a prebuilt binary, so values are not optimized away.
26. GODEBUG flags need no rebuild: `gctrace=1` (GC cycles, heap before->peak->live, CPU%), `schedtrace=1000,scheddetail=1` (run queues, `idleprocs=0` means saturated, threads above gomaxprocs means blocking syscalls).
27. Wrong result with no error: check silently dropped errors with `go vet ./...` and `errcheck`, and run `golangci-lint run`.

Common Go root causes (check these first)
28. Typed nil in an interface: `var e *MyErr; return e` returns a non-nil `error`. Return a literal `nil`.
29. `:=` in an inner scope shadows an outer `err`, so the outer one stays nil. Declare the variable and use `=`. `go vet` does not catch shadowing by default: add the `shadow` analyzer.
30. Write to a nil map panics (reads are fine). Make it with `make`.
31. `append` on a reslice can overwrite the original array. Cap it with `a[:2:2]`.
32. Loop variable captured by a goroutine: shared before Go 1.22 (pass it as an argument), per-iteration from 1.22.
33. `defer` arguments are evaluated at the `defer` line. `defer` in a loop runs at function return, so wrap the body in a closure. `os.Exit` and `log.Fatal` skip all defers.
34. Errors: wrap with `%w` (not `%v`), compare with `errors.Is/As` (not `==`), never `_` an error.
35. Context: a missing `defer cancel()` leaks. `context.Background()` inside a goroutine ignores the caller's cancel. Work that must outlive a request needs `context.WithoutCancel(ctx)` (Go 1.21+), not `r.Context()`.
36. Copying a `sync.Mutex`, `WaitGroup`, `Once` or `Pool` (value receiver, struct copy) breaks it. `go vet` reports copylocks. Use pointer receivers.
37. `http.Error` does not stop the handler: add `return`.
38. JSON: numbers decoded into `any` are `float64` (use a typed struct or `UseNumber`). Unexported fields are silently skipped.
39. `strings.Trim(s, "abc")` strips a character set. To remove a prefix use `strings.TrimPrefix`.
40. `len(s)` counts bytes, not runes. Slicing in the middle of a multi-byte rune corrupts text. Use `[]rune` or `utf8.RuneCountInString`.
41. A bare `break` inside `select` or `switch` leaves only that statement. Use a labeled `break loop`.
42. Reading a closed channel returns zero values at once, so a `select` case on it spins at 100% CPU. Set the channel variable to `nil` after `!ok`. `select` with `default` inside `for` also spins.
43. Only the sender closes a channel. Send on a closed channel panics.
44. `time.Time` with `==` fails when a monotonic reading differs. Use `t1.Equal(t2)` or `t.Round(0)`.
45. `db.Query` rows must be closed (`defer rows.Close()`) and `rows.Err()` checked. Use `Exec` for non-SELECT.
46. `int32(bigInt64)` silently truncates. Check bounds first.
47. `filepath.Join(base, userInput)` does not stop `../`. Use `os.OpenRoot` (Go 1.24+) or validate with `filepath.IsLocal`.
48. `iota` starting at 0 makes the zero value look like the first constant. Reserve 0 for `Unknown`.
49. Map iteration order is random. Sort the keys when output order matters.
50. `fallthrough` runs the next case body without testing its condition. `init()` order across files is fragile: initialize explicitly in `main`.

## Patterns

Panic trace anatomy:
```text
panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: segmentation violation code=0x1 addr=0x0 pc=0x4a1b2c]

goroutine 18 [running]:
main.(*Server).Handle(0x0, ...)          <- first frame in your code: receiver is 0x0 (nil)
        /app/server.go:42 +0x1c
main.main.func1()
        /app/main.go:30 +0x2a
created by main.main in goroutine 1      <- who started this goroutine
        /app/main.go:28 +0x6b
```

Hang or leak: capture, then read:
```bash
curl -s 'localhost:6060/debug/pprof/goroutine?debug=2' > goroutines.txt
grep -c 'chan receive' goroutines.txt
go tool pprof -top 'http://localhost:6060/debug/pprof/goroutine'
go tool pprof -base heap1.prof heap2.prof   # what grew between two heap snapshots
```

Race and flaky tests:
```bash
go test -race -count=1 ./...
go test -race -count=100 -failfast -run TestSuspect ./pkg/...
go test -shuffle=on -parallel 1 -count=10 ./pkg/...
```

Delve on a test:
```bash
dlv test ./pkg/orders -- -test.run TestCreate
(dlv) break orders.go:88
(dlv) continue
(dlv) locals
(dlv) goroutines
```

Typed nil and shadowed err:
```go
func doWork() error {
    var err *MyError // typed nil
    return err       // BUG: non-nil error. Fix: return nil
}

var err error
if cond {
    result, err := f() // BUG: new err. Fix: var result T; result, err = f()
    _ = result; _ = err
}
```

Closed channel in select, and loop exit:
```go
loop:
for {
    select {
    case v, ok := <-ch:
        if !ok { ch = nil; continue } // nil channel blocks forever: case is disabled
        process(v)
    case <-ctx.Done():
        break loop // a bare break would leave only the select
    }
}
```

Reuse a ticker, not `time.After`, in a loop:
```go
t := time.NewTicker(time.Second)
defer t.Stop()
for {
    select {
    case <-t.C: do()
    case <-ctx.Done(): return
    }
}
```

Temporary call-chain probe (delete afterwards):
```go
fmt.Fprintf(os.Stderr, "DEBUG val=%q\n%s\n", val, debug.Stack())
```

## Never

- Fix before you can explain the cause. Reproduce with a test, then trace to the origin.
- Add a nil check or `recover` to hide a crash. Fix where the bad value is created.
- Change several things at once, or stack fixes on a failed attempt. Revert, then test one hypothesis.
- Trust one clean `-race` run, or "fix" a race with `time.Sleep`. Write a test that forces the concurrency and use real synchronization.
- Restart a hung production process before capturing a goroutine dump and profiles.
- Expose `net/http/pprof` publicly. Use localhost or auth, behind an env toggle.
- Call a bug a Go or stdlib bug before you rule out your own code.
- Use `fmt.Println` for production debugging. Use `slog`.
- Ignore errors with `_`. Handle, wrap with `%w`, or write why it is safe.
- Rely on map order, init order or test order. Make them explicit.

## Check before you report

1. A test that failed before the fix and passes after: `go test -count=1 -run TestX ./pkg/...`.
2. The cause is stated in one sentence with `file:line`, and the fix is at that origin, not at the crash site.
3. `go test -race -count=1 ./...` is clean. For flaky or concurrent bugs also `go test -race -count=50 -run TestX`.
4. `go vet ./...` is clean (copylocks, printf) and `golangci-lint run` has no new findings, when the project has it.
5. For hangs and leaks: goroutine count before and after, or the dump no longer shows the stuck stack.
6. The full suite passes: `go test ./...`.
7. Debug probes (`debug.Stack`, `fmt.Println`, temporary logging) are removed. Any needed log uses `slog`.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-troubleshooting. https://github.com/samber/cc-skills-golang
