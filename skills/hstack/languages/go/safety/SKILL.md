---
name: hstack-go-safety
description: "Defensive Go against accidental bugs: nil panics, typed-nil interfaces, slice aliasing, numeric truncation, float comparison, defer in loops, defensive copies, zero values. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: safety

Read this when you write or review Go that handles nil, slices, maps, numeric conversions, resources or zero values, or when a program panics.
This covers our own mistakes in normal code. Attackers (injection, crypto, secrets) and concurrent access (goroutines, channels, locks) are separate topics.

## Rules

### Nil

1. An interface is nil only when both its type and value are nil. Never return a typed nil pointer (`var h *MyHandler; return h`) from a function that returns an interface: the caller's `== nil` check is false. Return a bare `nil`.
2. The same trap applies to `error`. Never `var err *MyErr` and return it on the success path. Return `nil` explicitly.
3. Writing to a nil map panics. Reading, `len` and `range` on a nil map are fine. Create it with `make` or lazily before the first write.
4. For a nil slice, `len`, `cap`, `range` and `append` work. Indexing or assigning by index panics. Sending on or receiving from a nil channel blocks forever.
5. Calling a method on a nil pointer panics if the method dereferences the receiver. Check for nil before calling methods on pointers that come from outside. Allow a nil receiver only on purpose, guard it with `if l == nil { return }`, and document it.
6. Calling a nil `func` value panics. Check it (`if w.onDone != nil`), or set a no-op default in the constructor.
7. You cannot compare an unconstrained type parameter to nil (`v == nil` with `T any` does not compile). Constrain to pointer types, or compare with a `var zero T` and be explicit about what "empty" means.
8. Use a comma-ok assertion (`v, ok := x.(T)`). A single-value assertion panics on mismatch. In reflection code on Go 1.25+, use `reflect.TypeAssert[T](v)` instead of `v.Interface().(T)`.
9. Use generics instead of `any` when the type set is known: the compiler then catches mismatches that would be runtime panics.

### Slices and maps

10. `append` may reuse the backing array. If `a` has spare capacity, `b := append(a, x)` shares memory with `a`, and writes through `b` change `a`. Force a copy with the full slice expression `append(a[:len(a):len(a)], x)`.
11. A subslice keeps the whole backing array alive. When you keep a small piece of a large slice, copy it: `slices.Clone(data[:64])` (Go 1.21+) or `make` plus `copy`.
12. Return defensive copies from exported methods that expose a slice or map, and keep the field unexported: `return slices.Clone(c.hosts)`. Use `slices.Clone` and `maps.Clone`. They are shallow, and they keep nil as nil.
13. Never depend on map iteration order. It is randomized. Sort keys when order matters: `slices.Sorted(maps.Keys(m))` (Go 1.23+).
14. Deleting map entries during `range` is safe. Deleting slice elements by `append(items[:i], items[i+1:]...)` inside a forward `range` skips elements. Use `slices.DeleteFunc` (Go 1.21+), or loop backwards.
15. Compare slices and maps with `slices.Equal` and `maps.Equal` (Go 1.21+), or the `EqualFunc` forms. `==` does not compile for them.
16. Before Go 1.22, the range variable was shared across iterations, so closures and `&v` all saw the last value. Re-declare (`v := v`) or take `&items[i]`. From Go 1.22 each iteration has its own variable, but only when `go.mod` says `go 1.22` or later. Check the directive first.

### Numbers

17. Integer conversions truncate silently: `int32(int64(3_000_000_000))` wraps to a negative value. Check against `math.MaxInt32` and `math.MinInt32` (or the target type's bounds) before narrowing, and return an error on overflow.
18. Integer division by zero panics. Guard the divisor. Float division by zero gives `+Inf`, `-Inf` or `NaN`, with no panic.
19. Never compare floats with `==`: `0.1+0.2 != 0.3`. Use `math.Abs(a-b) < epsilon`, or `math/big` or integer minor units (cents) for exact values.

### Resources and lifecycle

20. `defer` runs when the function returns, not at the end of a loop iteration. Deferring inside a loop piles up open files and locks. Move the body to a helper function that defers.
21. Check the error from the call that opened the resource before you `defer Close()`. Deferring on a nil handle can panic.
22. Make the zero value safe. `var mu sync.Mutex` and `var buf bytes.Buffer` work. A struct with a nil map field panics on first write, so lazy-init in the method or require a constructor.
23. Use `sync.Once` (or `sync.OnceValue`, Go 1.21+) for lazy one-time setup. It runs exactly once even under concurrency.
24. Do not rely on `init()` order across files: it is unspecified. Prefer explicit constructors.
25. A struct with a lock or channel must not be copied after first use. Pass it by pointer, and let `go vet` copylocks catch mistakes.

## Patterns

```go
// Return nil explicitly, not a typed nil (rules 1, 2).
func getHandler() http.Handler {
    if !enabled {
        return nil
    }
    return &MyHandler{}
}

// Lazy map in a zero-value-safe type (rules 3, 22).
func (r *Registry) Add(name string, v int) {
    if r.items == nil {
        r.items = make(map[string]int)
    }
    r.items[name] = v
}

// Stop two slices from sharing memory (rule 10).
b := append(a[:len(a):len(a)], 4)

// Bounds check before narrowing (rule 17).
if val > math.MaxInt32 || val < math.MinInt32 {
    return fmt.Errorf("value %d overflows int32", val)
}
i32 := int32(val)

// Per-iteration defer (rule 20).
for _, path := range paths {
    if err := processOne(path); err != nil {
        return err
    }
}

func processOne(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()
    return process(f)
}

// Defensive copy of an internal slice (rule 12).
func (c *Config) Hosts() []string { return slices.Clone(c.hosts) }

// Safe removal while filtering (rule 14).
items = slices.DeleteFunc(items, shouldDelete)
```

## Never

- `var m map[string]int; m["k"] = 1`: `make` the map first.
- `s := x.(string)` on untrusted input: use comma-ok.
- `var p *T; return p` from a function returning an interface or `error`: return `nil`.
- `defer f.Close()` inside a loop: extract a function.
- `int32(someInt64)` with no range check: check bounds first.
- `a+b == c` on floats: compare within an epsilon.
- `return c.items` (exported slice or map, shared): return a clone.
- `ptrs = append(ptrs, &item)` in a range loop on `go 1.21` or earlier: use `&items[i]`.
- `for range` plus `append(items[:i], ...)` to delete: use `slices.DeleteFunc`.
- Relying on map order or on `init()` order: sort keys, use constructors.
- Calling a method on a pointer that may be nil without a check: check first.

## Check before you report

- `go vet ./...` is clean (copylocks, nilness-related, printf, structtag).
- `golangci-lint run` passes. Useful: `errcheck`, `forcetypeassert`, `nilerr`, `staticcheck`, `govet`.
- `go test -race ./...` passes, including tests for the nil, empty and zero-value cases of your change.
- Grep the diff for `.(` assertions without `, ok`, `defer` inside `for`, `int32(`, `int(` and `uint(` narrowing, and `== 0.` float compares.
- Each exported function that returns a slice or map either returns a copy or documents sharing.
- Each new struct is usable at its zero value, or its only creation path is a constructor.
- The `go` directive in `go.mod` matches the loop-variable and library features you relied on.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-safety. https://github.com/samber/cc-skills-golang
