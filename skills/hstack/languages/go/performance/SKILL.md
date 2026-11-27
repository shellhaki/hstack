---
name: hstack-go-performance
description: "Go performance: measure first, then optimize. Benchmarks, pprof, benchstat, execution trace, escape analysis, allocation and CPU patterns, GC and runtime tuning, I/O and HTTP tuning, caching. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: performance

Read this when code is slow, allocates too much, or you are asked to write, run or compare a benchmark.
Never optimize on a guess. Measure, change one thing, measure again.

## Rules

Method
1. Profile before you change code. Intuition about bottlenecks is wrong most of the time.
2. Rule out an external bottleneck first. If goroutines sit in `net.(*conn).Read` or `database/sql`, or `fgprof` shows off-CPU time dominating, tune the DB or API, not the Go code.
3. Name the metric and the target (latency, throughput, memory, CPU) before you start. Without a target, changes are random.
4. Write one atomic benchmark per function. Mixed benchmarks contaminate each other.
5. Baseline with `-run='^$' -benchmem -count=10`. `-run='^$'` skips unit tests. Use `-count=6` for a quick look, 20-30 for changes under 5%.
6. Apply one optimization at a time. Add a comment saying why it is faster, with the numbers.
7. Compare with `benchstat old.txt new.txt`. Claim a win only when it shows a delta with `p<0.05`. A `~` means no proven difference: do not claim it.
8. Never rerun until `~` goes away. That is p-hacking. Raise `-count` once, then accept the result.
9. Compare on the same machine, load, `-count` and Go toolchain. A toolchain change (for example Go 1.26 to 1.27 allocator) measures the toolchain, so rebuild the baseline.
10. A confidence interval over about 5% means noise. Fix the noise (plug in, close apps, pre-compile with `go test -c` and interleave old/new runs) before you trust a delta.
11. Run benchmarks one at a time. Concurrent runs share the CPU and add noise.
12. Go 1.24+: write `for b.Loop() {}`. It excludes setup and keeps results alive. With legacy `b.N` loops, call `b.ResetTimer()` after setup and store results in a package-level sink so the compiler cannot delete the work.
13. Keep benchmarks in `<source>_bench_test.go`, in the same order as the functions they measure.
14. Commit with `perf(scope): summary` and paste the benchstat rows for the affected benchmarks only, plus the `goos/goarch/cpu` line. Drop any `~` rows.

Picking a profile
15. High CPU or slow function: CPU profile. Low CPU but high latency: execution trace, goroutine and block profiles, or `fgprof`.
16. GC churn: `-alloc_objects`. Bytes allocated: `-alloc_space`. Leak or growing memory: `-inuse_space`, and diff two snapshots with `go tool pprof -base a.prof b.prof`.
17. Mutex and block profiles are off by default. Call `runtime.SetMutexProfileFraction(5)` and `runtime.SetBlockProfileRate(1)`, and set both back to 0 afterwards.
18. If `top` shows `runtime.mallocgc`, `memmove` or `scanobject`, those are symptoms. Use `top -cum`, `list fn` and `peek fn` to find the application function that causes them.
19. Use the compiler flags only on functions the profile marks hot: `-gcflags=-m` (escape and inlining), `-m -m` (the reason), `GOSSAFUNC=Fn go build` (SSA), `go tool objdump -s Fn bin` (assembly).
20. Use the execution trace for scheduling delay, GC pauses and lock timelines. Keep captures to 5-10 s. For rare spikes in production, use `runtime/trace.FlightRecorder` (Go 1.25+).

Allocation and memory (biggest return first)
21. Fix the algorithm before constants: `slices.Contains` in a loop, nested scans and `+=` on strings are O(n^2). Use a `map[T]struct{}`, a sort plus binary search, or `strings.Builder`.
22. Preallocate: `make([]T, 0, n)` and `make(map[K]V, n)`. When output size equals input size, assign by index. Use `append` when filtering.
23. Range with the value (`for k, v := range m`), not a second `m[k]` lookup.
24. Keep concrete types out of `any` in hot paths. Boxing allocates. Use typed parameters or generics.
25. Use preallocated sentinel errors in hot paths. `fmt.Errorf` allocates on every call. Use it only when you need dynamic context.
26. A small reslice or substring keeps the whole backing array alive. Copy it (`copy` into a new slice, `strings.Clone` from Go 1.20). A map never releases buckets after deletes: rebuild it to reclaim memory.
27. `string` to `[]byte` conversion copies. Convert once, or use the `bytes` package directly.
28. Use `sync.Pool` only for frequent, short-lived objects. Store pointers (`*[]byte`), reset before `Put`, return copies (never the pooled buffer), and skip objects over about 32 KB or rarely used ones.
29. Compile `regexp` and parse templates once at package level. Per-call compile costs 10x or more.
30. Use `singleflight` so concurrent misses on one key trigger one fetch.
31. Order struct fields from large to small alignment (`fieldalignment ./...`; apply the change by hand, not with `-fix`). Put a zero-size `struct{}` field first, not last.
32. Use pointer receivers for structs over about 128 bytes. Use `map[K]*V` for large, often-updated values, and accept the extra GC pressure.
33. Reduce pointer density to cut GC scan cost (`scanobject`): values over pointers in slices, flat structures, index-based nodes.

CPU
34. Walk memory in row order. Allocate 2D data as one slab. Use struct-of-arrays when you scan one field. Cache lines are 64 bytes.
35. Pad per-goroutine counters to a cache line (false sharing) only when profiling proves contention.
36. Keep hot leaf functions small so they inline. Logging calls, `defer`, `recover`, `go`, `select` and big bodies block inlining. The budget is about 80 nodes. Do not assume value or pointer receivers inline better: read `-gcflags=-m`.
37. In hot paths avoid `reflect`, `reflect.DeepEqual` (use `slices.Equal`, `maps.Equal`, `bytes.Equal`, Go 1.21+), closure-wrapped helpers and iterator chains. Write a direct loop with early return. Use one type switch, not repeated assertions.
38. Use `slog.LogAttrs` with typed attrs on hot paths. Never build the message with `fmt.Sprintf` before the level check.
39. Do not use `panic`/`recover` for control flow. It unwinds the stack and is 10-100x slower than returning an error.
40. Reach for `unsafe`, assembly, multi-accumulator loops or SIMD only with a profile showing the loop above 10-20% of CPU and a benchmark proving the gain. `simd` and `simd/archsimd` are experimental (`GOEXPERIMENT=simd`): never in a public API.
41. A tight loop with no function calls can starve other goroutines. Go 1.14+ preempts asynchronously, so add `//go:noinline` only when a trace shows starvation.

I/O and network
42. Never use zero-value `http.Client` or `http.Server`: they have no timeouts. Set `Timeout`, `ReadTimeout`, `WriteTimeout`, `IdleTimeout`.
43. `Transport.MaxIdleConnsPerHost` defaults to 2. Raise it to match concurrency, and share one client across calls.
44. Drain and close the response body (`io.Copy(io.Discard, resp.Body)`) or the connection is not reused.
45. Stream large data: `bufio.Scanner`, `json.NewDecoder`, `io.Copy`. Use `io.ReadAll` only for small, bounded payloads (under about 1 MB).
46. Wrap files in `bufio.Reader/Writer` for many small operations, and `Flush`. This cuts syscalls 3-10x.
47. Batch DB inserts (multi-row or COPY), API calls and channel items (flush on size and on a timer).
48. Each cgo call costs about 50-100 ns. Batch across the boundary or use pure Go.
49. `encoding/json` is reflection-based. Consider generated code or a faster library only after profiling. `encoding/json/v2` is stricter than v1 (duplicate keys, invalid UTF-8): rerun tests on real payloads first.
50. Split work into concurrent pipeline stages only when stages saturate different resources and order does not matter. Sequential plus batching often wins.

Runtime and GC
51. Cutting allocations beats tuning GOGC. Check `GODEBUG=gctrace=1`: GC above about 5% CPU, or over 2 cycles/s sustained, means too much allocation.
52. In containers set `GOMEMLIMIT` (Go 1.19+) to about 80-90% of the memory limit. It is a soft limit. Higher `GOGC` means fewer GCs and more memory; `GOGC=off` is for tests only. Ballast arrays are obsolete.
53. GOMAXPROCS: Go 1.25+ reads the cgroup CPU limit (cgroup v2). On older Go or cgroup v1, use `go.uber.org/automaxprocs` and verify `runtime.GOMAXPROCS(0)` at startup.
54. PGO (Go 1.21+): put a 30 s or longer production CPU profile at `<main pkg>/default.pgo`. Expect 2-7%. Refresh it after big code changes.

Production and CI
55. Watch `rate(go_gc_duration_seconds_count[5m])`, `go_goroutines` (growing without traffic means a leak), `rate(go_memstats_alloc_bytes_total[5m])` (compare across deploys) and CPU against GOMAXPROCS. Keep pprof, continuous profiling and traces behind env toggles, on one instance, for a short time.
56. In CI compare base and head in the same job on the same machine with `benchstat` (`-count=10` or more). Use thresholds of 20% or more on shared runners. Never retry until it passes. `cob` runs `git reset`: commit first.

## Patterns

Benchmark, baseline, change, compare:
```go
func BenchmarkParse(b *testing.B) {
    data := loadFixture("large.json") // setup, not timed
    b.ReportAllocs()
    for b.Loop() { // Go 1.24+
        Parse(data)
    }
}
```
```bash
go test -run='^$' -bench=BenchmarkParse -benchmem -count=10 ./pkg/parser | tee old.txt
# change one thing
go test -run='^$' -bench=BenchmarkParse -benchmem -count=10 ./pkg/parser | tee new.txt
benchstat old.txt new.txt
```

Profile from a benchmark, then drill down:
```bash
go test -run='^$' -bench=BenchmarkParse -cpuprofile=cpu.prof -memprofile=mem.prof ./pkg/parser
go tool pprof -top -cum cpu.prof            # application functions, not runtime ones
go tool pprof -list 'Parse' cpu.prof        # cost per line
go tool pprof -alloc_objects -top mem.prof  # who allocates most often
go test -run='^$' -bench=BenchmarkParse -trace=trace.out ./pkg/parser && go tool trace trace.out
```

Profile a running service (pprof must be protected, see debug and observability):
```bash
go tool pprof 'http://localhost:6060/debug/pprof/profile?seconds=30'
curl -o trace.out 'http://localhost:6060/debug/pprof/trace?seconds=5'
go tool trace -pprof=sync trace.out > sync.prof   # also: net, syscall, sched
```

Why does it allocate:
```bash
go build -gcflags='-m -m' ./pkg/parser 2>&1 | grep -E 'escapes to heap|moved to heap|cannot inline'
```

Pooled buffer (reset, return a copy):
```go
var bufPool = sync.Pool{New: func() any { b := make([]byte, 0, 4096); return &b }}

func render(in []byte) []byte {
    bp := bufPool.Get().(*[]byte)
    buf := (*bp)[:0]
    defer func() { *bp = buf; bufPool.Put(bp) }()
    buf = append(buf, in...) // ... build output in buf
    return append([]byte(nil), buf...) // copy: buf goes back to the pool
}
```

Service-to-service HTTP client and server with timeouts:
```go
client := &http.Client{Timeout: 30 * time.Second, Transport: &http.Transport{
    MaxIdleConns: 100, MaxIdleConnsPerHost: 20, IdleConnTimeout: 90 * time.Second,
    TLSHandshakeTimeout: 5 * time.Second, ResponseHeaderTimeout: 10 * time.Second,
}}
srv := &http.Server{Addr: ":8080", Handler: h, ReadTimeout: 5 * time.Second,
    WriteTimeout: 10 * time.Second, IdleTimeout: 120 * time.Second}
```

Cheap logging in a hot loop:
```go
slog.LogAttrs(ctx, slog.LevelDebug, "item", slog.Int("id", it.ID))
```

GC and PGO:
```bash
GODEBUG=gctrace=1 ./app 2>&1 | head   # gc N @t X%: ... 45->92->50 MB, 200 MB goal
GOMEMLIMIT=450MiB ./app                # 512 MiB container
curl -o default.pgo 'http://localhost:6060/debug/pprof/profile?seconds=60' && mv default.pgo ./cmd/app/
```

## Never

- Optimize without a profile or benchmark. Measure first.
- Claim a speedup from one run, `-count=1`, or a `~` row. Use `-count=10` and benchstat.
- Compare runs from different machines, toolchains or loads. Re-run the baseline.
- Benchmark a call whose result the compiler can drop (legacy `b.N`). Use `b.Loop()` or a sink.
- Return a pooled buffer to the caller or `Put` without reset. Copy out, reset first.
- Use `http.Client{}` or `http.Server{}` with no timeouts. Set them.
- Log or `fmt.Sprintf` in a tight loop. Use `slog.LogAttrs`, or move the log out of the loop.
- Compile `regexp` or templates inside a handler. Make them package-level vars.
- Use `reflect.DeepEqual` in production paths. Use `slices.Equal`, `maps.Equal`, `bytes.Equal`.
- Apply `fieldalignment -fix`, padding, SIMD or `unsafe` without proof. Change by hand, with a comment and numbers.
- Set `GOGC=off` or a ballast in production. Use `GOMEMLIMIT` and fewer allocations.
- Leave mutex/block profiling, debug logs or continuous profiling on everywhere. Toggle by env, one instance.

## Check before you report

1. `go test -run='^$' -bench=<name> -benchmem -count=10 ./pkg/...` run before and after, same machine and toolchain.
2. `benchstat old.txt new.txt` shows `p<0.05` on the metric you targeted, and no `~` is reported as a win.
3. `go test -race ./...` and the normal tests still pass, so the optimization kept behavior.
4. `go build -gcflags=-m ./pkg/...` confirms the claimed change (fewer escapes, function now inlines) where you claimed it.
5. `go vet ./...` is clean and `fieldalignment ./...` has no new findings on structs you touched.
6. A comment next to each non-obvious optimization says why it exists, with before/after numbers.
7. For production claims, name the metric you checked (`go_gc_duration_seconds`, `go_goroutines`, p99 histogram) and the time window.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-performance, golang-benchmark. https://github.com/samber/cc-skills-golang
