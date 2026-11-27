---
name: hstack-go-libraries
description: "The samber Go libraries lo (collection helpers), mo (Option, Result, Either), ro (reactive streams) and hot (in-memory cache): what each is for, key APIs, traps, and when the standard library is better. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: libraries (lo, mo, ro, hot)

Read this only when the project already imports one of `github.com/samber/lo`, `mo`, `ro` or `hot`, or the user asked for it.
Otherwise use the standard library. Do not add these libraries on your own.

## Rules

### Before anything

1. Check the project uses the library: `grep -n "samber/" go.mod`. If it is absent, write plain Go with `slices`, `maps`, `cmp` and loops. Ask the user before `go get`.
2. Match the version already in `go.mod`. Look up exact signatures with `go doc github.com/samber/lo Map` or pkg.go.dev. Do not guess them.
3. Follow the style already in the codebase. Do not convert plain loops to `lo` in an unrelated change.
4. Prefer the standard library when it covers the job. A library for one `Contains` call is a dependency for nothing.

### Standard library first

5. Use `slices.Contains`, `slices.Sort`, `slices.SortFunc`, `slices.Clone`, `slices.Min` and `slices.Max` (Go 1.21+) instead of lo.
6. `maps.Keys` and `maps.Values` return iterators (Go 1.23+). Use `slices.Collect(maps.Keys(m))` when you need a slice.
7. Use `log/slog` for structured logging, `golang.org/x/sync/errgroup` for bounded concurrent work with errors, and `cmp.Or` and `cmp.Compare` for comparisons.
8. Use a plain `for` loop when it is shorter or clearer than the callback chain. Do not nest three `lo` calls. Name the intermediate values.

### samber/lo

9. `lo` is for Map, Filter, Reduce, GroupBy, Chunk, Flatten, Uniq, Zip and similar transforms that `slices` and `maps` lack. Functions return new collections. The input is not changed.
10. Callbacks take the index as a second argument: `func(item T, index int)`. Write `_ int` when you do not need it. Forgetting it is a compile error.
11. Many functions have an `Err` variant (`MapErr`, `FilterErr`, `ReduceErr`) that stops at the first error. Use it instead of collecting errors by hand.
12. `lo.Must` and the `Must*` helpers panic on error. Use them in tests and init code only, never in request handlers.
13. Subpackages: `lo/parallel` (`lop`) for CPU-bound work on large data (about 1000+ items). It has goroutine overhead and is wrong for I/O or small slices. Use `errgroup` for I/O fan-out.
14. `lo/mutable` (`lom`) changes the input in place. Use it only after profiling shows allocation pressure, and tell the reader.
15. `lo/it` (`loi`, Go 1.23+) is lazy and avoids intermediate slices in long chains. `lo/exp/simd` is experimental with no semver guarantee, so pin the version if you use it.
16. Do not switch from `lo` to `lop` or `lom` without a benchmark or profile.

### samber/mo

17. `mo.Option[T]` marks a value that may be absent (`Some`, `None`, `Get`, `OrElse`). `mo.Result[T]` wraps `(T, error)`. `mo.Either[L, R]` holds one of two valid alternatives, with neither being an error.
18. Use `Result` when one side is a failure. Use `Either` only when both sides are valid (cached vs fresh).
19. Use `Option` for a nullable field where "absent" differs from the zero value. Use the plain type when an empty string or `0` is valid.
20. `Option` implements `json.Marshaler`, `json.Unmarshaler`, `sql.Scanner` and `driver.Valuer`. It works in JSON structs and database models.
21. Convert at the boundary: `mo.TupleToResult(os.ReadFile(p))` or `mo.TupleToOption(m[k])`. Then chain inside the domain code.
22. Direct methods `.Map` and `.FlatMap` cannot change the type, because Go methods cannot add type parameters. `Option.Map` takes `func(T) (T, bool)`, and `Result.Map` takes `func(T) (T, error)`. To change the type, use `option.Map`, `result.Map` and `Pipe2`, `Pipe3` from the subpackages, or `mo.Do`.
23. `MustGet` panics on `None` or `Err`. Use it only inside `mo.Do`, which catches the panic and returns it as an error. Elsewhere use `OrElse` or `Get`.
24. `mo` also has `Future`, `IO`, `Task` and `State`. Do not reach for them in ordinary Go code. Plain `(T, error)` is idiomatic, and a codebase that does not use `mo` should not start.

### samber/ro

25. `ro` is ReactiveX for Go. Use it for infinite or time-based event streams: websockets, tickers, file watchers, or combining several async sources with retry, timeout and throttling.
26. For a finite slice use `lo`. For simple bounded goroutine fan-out use `errgroup`. `ro` there adds goroutines and subscriptions for nothing.
27. Observables are cold by default: each `Subscribe` runs the source again. Use `Share`, `ShareReplay(n)` or subjects only when several consumers must see one execution.
28. Always pass all three callbacks: `ro.NewObserver(onNext, onError, onComplete)`. Using only `OnNext` drops errors silently.
29. Use typed `Pipe2`...`Pipe25`. The untyped `Pipe` loses compile-time type checks.
30. Bound infinite streams with `Take`, `TakeUntil`, `Timeout`, a context, or `Unsubscribe()`. An unbounded stream leaks a goroutine.
31. `ro.Collect(observable)` blocks until a finite stream completes and returns `[]T` and an error. `UnicastSubject` allows one subscriber only. Use `PublishSubject` for several.

### samber/hot

32. `hot` is an in-memory cache with eviction algorithms, TTL, loaders, sharding and Prometheus metrics. Start with `hot.WTinyLFU`. Change algorithm only when measured hit rate is too low.
33. Always set a TTL, because an unbounded cache serves stale data forever. Add `WithJitter(lambda, upperBound)` so entries created together do not all expire together.
34. Chain `.WithJanitor()` in the builder and `defer cache.StopJanitor()`. Without it, expired entries stay in memory until evicted.
35. `Get` returns `(value, found, err)`. On a loader failure it returns `(zero, false, err)`. Check `err`, not just `found`.
36. A loader passed to `WithLoaders` receives a batch of keys and returns a map. Concurrent `Get` calls for the same missing key share one loader call (singleflight).
37. `SetMissing()` panics unless the builder enabled `WithMissingCache` or `WithMissingSharedCache`. `WithoutLocking()` and `WithJanitor()` are mutually exclusive and panic together.
38. Size the cache from a memory budget: `capacity = memoryBudget / entrySize`. Entry size is the value, the key, and about 100 bytes of overhead. Ask the user for the budget. Do not guess.
39. Cached values are shared. If callers can mutate them, use `WithCopyOnRead` or `WithCopyOnWrite`, or store immutable values.
40. `MustGet` and `MustGetMany` on a `hot` cache panic on loader errors. Avoid them in request paths.

## Patterns

lo transform with index parameter and an error variant:

```go
names := lo.Map(users, func(u User, _ int) string { return u.Name })

active := lo.Filter(users, func(u User, _ int) bool { return u.Active })

resp, err := lo.MapErr(urls, func(u string, _ int) (Response, error) {
	return fetch(u)
})
```

Standard library equivalent where lo is not needed:

```go
if slices.Contains(ids, id) { /* ... */ }
keys := slices.Sorted(maps.Keys(m))   // Go 1.23+
```

Group and count with lo (stays immutable):

```go
byStatus := lo.GroupBy(tasks, func(t Task, _ int) string { return t.Status })
```

mo at an API boundary, with a type-changing step:

```go
r := result.Pipe2(
	mo.TupleToResult(os.ReadFile("config.yaml")),
	result.Map(func(b []byte) Config { return parse(b) }),
	result.FlatMap(func(c Config) mo.Result[Config] { return validate(c) }),
)
cfg, err := r.Get()
```

mo Option in a struct:

```go
type User struct {
	Email string
	Phone mo.Option[string] // NULL-able column, null-able JSON field
}
phone := u.Phone.OrElse("none")
```

ro pipeline with all three callbacks:

```go
obs := ro.Pipe2(
	ro.RangeWithInterval(0, 5, time.Second),
	ro.Filter(func(x int) bool { return x%2 == 0 }),
	ro.Map(func(x int) string { return fmt.Sprintf("even-%d", x) }),
)
obs.Subscribe(ro.NewObserver(
	func(s string) { fmt.Println(s) },
	func(err error) { log.Println(err) },
	func() { fmt.Println("done") },
))
```

hot cache with TTL, jitter-free baseline, and a batch loader:

```go
cache := hot.NewHotCache[int, *User](hot.WTinyLFU, 10_000).
	WithTTL(5 * time.Minute).
	WithLoaders(func(ids []int) (map[int]*User, error) {
		return db.UsersByIDs(ctx, ids)
	}).
	WithJanitor().
	Build()
defer cache.StopJanitor()

u, found, err := cache.Get(123)
if err != nil { return err }
```

## Never

- Adding `lo`, `mo`, `ro` or `hot` to a project that does not use them. Use the standard library, and ask first.
- `lo.Contains`, `lo.Sort` or `lo.Keys` where `slices` or `maps` does the job.
- `lop` on small slices or I/O work. Use `lo`, or `errgroup`.
- `lom` as a "speed-up" without a profile.
- `lo.Must` or `MustGet` in a request handler or library code. Handle the error.
- Expecting `.Map` on an `Option` or `Result` to change its type. Use the subpackage functions.
- Wrapping every `(T, error)` in `mo.Result` in a codebase that returns errors the normal way.
- `ro` for a finite slice, `OnNext`-only subscribers, or an infinite stream with no bound.
- A `hot` cache with no TTL, no janitor, or a capacity guessed without a memory budget.
- Ignoring the `err` from `cache.Get`.
- Mutating a value you got back from a shared cache.

## Check before you report

- `grep -n "samber/" go.mod` confirms the library is already a dependency (or the user approved adding it).
- `go build ./... && go vet ./... && go test ./...` passes. Run `go test -race ./...` for any `lop`, `ro` or `hot` change.
- Each `lo` callback has the `(item, index)` signature, and no `Must*` call sits in a production path.
- No `lo` call duplicates a `slices` or `maps` function. Check with `grep -rn "lo\.\(Contains\|Keys\|Values\)" --include=*.go .`.
- For `ro`: every `Subscribe` has an error callback, and each infinite stream has a stop (`Take`, `TakeUntil`, `Timeout`, context or `Unsubscribe`).
- For `hot`: TTL set, janitor started and stopped, capacity comes from a stated memory budget, and `err` from `Get` is checked.
- You say in the report which APIs you checked against `go doc`, and which you could not check.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-samber-lo, golang-samber-mo, golang-samber-ro, golang-samber-hot. https://github.com/samber/cc-skills-golang
