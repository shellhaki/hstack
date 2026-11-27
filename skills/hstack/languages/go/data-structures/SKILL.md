---
name: hstack-go-data-structures
description: "Go slices, maps, arrays, container/list/heap/ring, strings.Builder vs bytes.Buffer, bufio, generic collections, pointers (unsafe, weak), and copy semantics. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: data structures

Read this when you pick a collection type, size or grow a slice or map, build strings, write a generic container, or touch `unsafe` or `weak`.
Choose by access pattern and allocation cost, not by habit.

## Rules

Slices
1. A slice is a 3-word header (pointer, length, capacity). Copying or passing it copies the header only. Both copies share one backing array, so writes show up in both.
2. Preallocate when the size is known or can be estimated: `make([]T, 0, n)`. Use `make([]T, n)` and index directly when you fill every slot. Each regrowth copies the whole array.
3. Use `slices.Grow(s, n)` (Go 1.21+) before a bulk append.
4. Never depend on when `append` reallocates. The growth rule has changed across Go versions (it was double below 256 elements, then about 25% plus a constant).
5. To get an independent copy, use `slices.Clone(s)` or `copy` into a new slice. To stop an append from writing into a shared array, cap the slice: `s[:len(s):len(s)]`.
6. Prefer the `slices` package (Go 1.21+): `Sort`, `SortFunc`, `SortStableFunc`, `BinarySearch`, `Contains`, `Index`, `Insert`, `Delete`, `Compact`, `Clone`, `Equal`. `Concat` is 1.22+. `Repeat` and `Chunk` are 1.23+.

Maps
7. A map is a reference type. Assigning it copies the pointer. Use `maps.Clone` (Go 1.21+) for a shallow copy.
8. Preallocate with `make(map[K]V, n)` when you know the size. It avoids repeated growth and rehashing.
9. Maps do not shrink after deletes. To release memory, copy the live entries into a new map.
10. Keys must be comparable: numbers, strings, bools, pointers, channels, interfaces, arrays of comparable types, structs whose fields are all comparable. Slices, maps, and funcs cannot be keys.
11. Map reads copy the whole value. For large value types use `map[K]*V`. Small structs (under about 128 bytes) are usually faster stored by value, and pointers add GC load.
12. Iteration order is random. Sort the keys (`slices.Sorted(maps.Keys(m))`, Go 1.23+) when order matters.
13. `maps.Keys`, `Values`, `All`, `Collect`, `Insert` are Go 1.23+ and work with iterators.
14. A plain map is not safe for concurrent writes. Guard it, or see the concurrency guide.

Arrays
15. Use arrays only for fixed, compile-time sizes (digests, IP addresses, grid dimensions). They are value types, copied whole on assignment and pass-by-value. Arrays are comparable and work as map keys.

container/ and I/O
16. `container/heap` for priority queues, top-K, scheduling. You implement `heap.Interface`. `Push` and `Pop` are O(log n), `Init` is O(n), `Fix` re-sorts after a priority change.
17. `container/list` only for LRU-style caches or frequent insert and remove at known elements (O(1) with an `*Element`). Index access is O(n). A slice is usually faster because of cache locality, so benchmark first.
18. `container/ring` for fixed-size circular buffers and rolling windows.
19. Container packages store `any`. Wrap them in a typed generic type to regain type safety.
20. `strings.Builder` to build strings: `String()` does not copy. `bytes.Buffer` when you need `io.Reader` and `io.Writer`, or byte editing. Both have `Grow(n)`.
21. `bufio.Writer`: call `Flush()` and check its error. Unflushed data is lost, and an ignored flush error hides lost data.
22. `bufio.Scanner` stops on tokens over 64 KB. Call `scanner.Buffer()` for longer lines, and check `scanner.Err()`.

Generics (Go 1.18+)
23. Use the tightest constraint: `comparable` for keys and set members, `cmp.Ordered` for sorting and min/max, `any` only when you just store and return, a custom interface for domain behavior.
24. `~int` matches every type whose underlying type is `int` (for example `type UserID int`).
25. Skip generics for one concrete type, for `any` plus type switches, or when constraints get convoluted. Use an interface instead.

Pointers
26. `&T{...}` is preferred over `new(T)` because it can set fields.
27. A value escapes to the heap when its address outlives the function. Check hot paths with `go build -gcflags=-m`.
28. `unsafe.Pointer`: use only the conversion patterns the Go spec and `unsafe` package docs list. Anything else is undefined behavior.
29. Never keep a `uintptr` made from a pointer across statements. The object can move or be freed, and you get a dangling pointer. Keep the conversion in one expression.
30. Prefer `unsafe.Add`, `unsafe.Slice`, `unsafe.String`, `unsafe.SliceData`, `unsafe.StringData` (Go 1.17 and 1.20) over manual `uintptr` math. They keep values visible to the GC.
31. `weak.Pointer[T]` (Go 1.24+) holds a reference without blocking GC. `Value()` returns nil once collected. Use it for caches and canonicalization maps.
32. Prefer `runtime.AddCleanup` (Go 1.24+) over `runtime.SetFinalizer`. Many cleanups per object, no resurrection, and it works with weak pointers.

## Patterns

Preallocate, then fill:
```go
out := make([]Result, 0, len(in))
for _, v := range in {
    out = append(out, transform(v))
}
m := make(map[string]*User, len(users))
```

Cap a slice so a later append cannot overwrite the original:
```go
head := s[:2:2]
head = append(head, x) // reallocates, s is untouched
```

Generic set:
```go
type Set[T comparable] map[T]struct{}

func (s Set[T]) Add(v T)           { s[v] = struct{}{} }
func (s Set[T]) Contains(v T) bool { _, ok := s[v]; return ok }
```

Sorted insert:
```go
func InsertSorted[T cmp.Ordered](s []T, v T) []T {
    i, _ := slices.BinarySearch(s, v)
    return slices.Insert(s, i, v)
}
```

Copy behavior at a glance:

| Type | Copy gives |
| --- | --- |
| array, struct, number, string, bool | independent value |
| slice | new header, shared backing array (`slices.Clone` to detach) |
| map | same map (`maps.Clone` for a shallow copy) |
| pointer, channel | same target |

## Never

- Appending in a loop with a known size and no `make` capacity. Preallocate.
- `container/list` as a default queue or stack. Use a slice.
- `bytes.Buffer` to build a plain string. Use `strings.Builder`.
- `u := uintptr(unsafe.Pointer(&x))` then `unsafe.Pointer(u)` on a later line. Do it in one expression, or use `unsafe.Add`.
- `map[K]BigStruct` that you read often. Store pointers.
- Using a slice or map as a map key. Use an array, a struct of comparable fields, or a string key.
- Relying on map iteration order or on the exact capacity after `append`.
- Ignoring the error from `bufio.Writer.Flush()`. Check it.
- Generic code with `any` and a type switch. Use a real constraint or an interface.

## Check before you report

- `go vet ./...` (flags unsafe misuse and copied values).
- `go test -race ./...` if any map or slice is shared across goroutines.
- `golangci-lint run` if configured (`prealloc`, `govet`, `staticcheck`).
- For a performance claim, run `go test -bench=. -benchmem` before and after. Do not claim a speedup you did not measure.
- Check allocations in hot paths with `go build -gcflags=-m` when you worry about escape.
- Confirm the `go` directive in `go.mod` covers every API you used (`slices`/`maps` 1.21, iterators 1.23, `weak` 1.24).

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-data-structures. https://github.com/samber/cc-skills-golang
