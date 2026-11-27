---
name: hstack-go-style
description: "Go code style, naming, struct and interface design, and modernizing old Go to current idioms. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: style, naming, types, modern idioms

Read this before writing or reviewing Go code that adds names, types, interfaces or control flow, or when old code should use newer language features.
Linters handle formatting. These rules cover the judgment calls. When you break a rule on purpose, leave a comment saying why.

## Rules

### Layout and control flow

1. Handle errors and edge cases first and return early. The happy path stays at the lowest indent.
2. Drop `else` after a block that ends in `return`, `break` or `continue`. It adds nesting for nothing.
3. For a simple assignment, set the default first, then override with a `switch` or independent `if`s. Do not chain `else if` to hide the default.
4. Compare one variable against many values with `switch`, not an `if/else` chain.
5. Extract an `if` condition with 3+ operands into named booleans. Keep an expensive check inline as the last operand so `||` short-circuits.
6. Scope variables to the `if` that needs them: `if err := validate(x); err != nil`.
7. Break lines over about 120 characters at semantic boundaries. Put one argument per line for calls with 4+ arguments.
8. Keep functions short and focused, with at most 4 parameters. Past that, use an options struct. The real fix for a long signature is fewer parameters, not better wrapping.
9. Put `context.Context` first, then inputs, then output destinations.
10. Use naked returns only in 1-3 line functions. Never name returns just to allow bare `return`.
11. Prefer `range` over index loops. Use `range n` (Go 1.22+) for plain counting.

### Declarations and values

12. Use `var x T` for a zero value that is set later, and `:=` for a non-zero value. The form signals intent.
13. Initialize maps before any write: a nil map panics on write.
14. Use `[]T{}` or `make([]T, 0, n)` for a slice that is returned or JSON-encoded: a nil slice encodes as `null`, an empty one as `[]`. Preallocate only when the size is known.
15. Use field names in composite literals. Positional fields break when the type gains or reorders fields.
16. Pass small types (`string`, `int`, `bool`, `time.Time`) by value. Use a pointer to mutate, for large structs (about 128+ bytes), or when nil is meaningful. Never use a pointer "to save memory".
17. Use `strconv` for simple conversions and `fmt.Sprintf` for complex formatting. Use `%q` in error text to show string boundaries. Use `strings.Builder` in loops.
18. Use generics instead of `any` when a concrete type set will do (Go 1.18+). Keep `any` for true boundaries such as JSON decoding and reflection.

### File and package organization

19. Order a file: package doc, imports, constants, types, constructors, methods, helpers. Keep a type, its constructor and its methods together.
20. Restrict blank imports (`_ "pkg"`) to `main` and test packages, so side effects stay visible at the app root.
21. Never use dot imports in library code: readers cannot tell where a name comes from.
22. Unexport by default. Exporting later is cheap. Unexporting is a breaking change.
23. Name packages in lowercase, single word, singular, no underscores or MixedCaps (`net/url`, not `net/urls`). Never use `util`, `helper`, `common`, `base` or `model`.
24. Match the directory name to the package name. A hyphenated directory gives a package without the hyphen (`rate-limit/` is `package ratelimit`). Files are lowercase with underscores (`user_handler.go`).
25. Alias an import only on a name collision (`mrand "math/rand"`) or for generated code (`pb`).
26. Do not abstract early. Copy a little before adding a dependency. Avoid `reflect` unless needed. Every exported name is a commitment.

### Naming

27. Use MixedCaps everywhere. No snake_case or `ALL_CAPS` constants. Underscores are allowed only in test subcase names (`TestFoo_InvalidInput`), generated code and OS/cgo interop.
28. Do not repeat the package or type name: `http.Client`, `user.New()`, `config.Parse()`. This applies to every exported name in the package, including `Status` and `Option`.
29. Name a constructor `New` when the package has one main type, and `NewTypeName` when it has several (`http.NewRequest`).
30. Write acronyms all caps or all lower, never mixed: `URL`, `HTTPServer`, `userID`, `xmlParser`. Exporting a lowercase acronym capitalizes all of it.
31. Scale name length to scope. `i` is fine for a 3-line loop. Package-level names must be descriptive.
32. Name the value, not its type: `users`, not `userSlice`. Use one name per concept across the codebase (`user`, not `user`/`account`/`person`).
33. Give receivers a 1-2 letter abbreviation of the type, the same in every method. Never `this` or `self`.
34. Do not prefix getters with `Get`: `u.Name()`. Keep `Is`/`Has`/`Can` on boolean methods and on boolean fields (`isConnected`, `IsConnected()`).
35. Use `Fetch` or `Compute` for expensive or blocking reads. Use `Get` only when the domain says so (HTTP GET).
36. End format-string functions in `f` (`Errorf`, `Wrapf`). Use `WithContext` for the context variant, an `In` suffix for in-place mutation, and a `Must` prefix for functions that panic.
37. Name single-method interfaces by method plus `-er` (`Reader`, `Closer`). Keep canonical signatures. If you have `String()`, it must match `fmt.Stringer`. Never `ToString()` or `ReadData()`.
38. Name sentinel errors `ErrNotFound`, with the package prefix in the text (`"mypkg: not found"`). Name error types with an `Error` suffix (`PathError`).
39. Write error strings in lowercase, including acronyms (`"invalid id"`), with no trailing punctuation: they get concatenated mid-sentence.
40. Name constants by role, not value: `DefaultPort`, not `Port8080`.
41. Prefix enum values with the type name. Put an `Unknown` sentinel at `iota` 0, or start at `iota + 1`. A zero-value `var s Status` must not look like a real state.
42. Name tests `TestFunc`, `TestType_Method`, `TestFunc_Subcase`. Write table-case names as lowercase phrases (`"valid id"`). Use `input` and `expected` fields. Name panicking test helpers `mustX`.
43. Name functional options `ServerOption` (singular type) with `WithPort()` constructors and a `DefaultServerOptions()` factory. Use `With*` consistently, not a mix of `Set*` and `Use*`.

### Structs and interfaces

44. Keep interfaces to 1-3 methods and compose larger ones from small ones.
45. Define interfaces in the package that consumes them, not the one that implements them.
46. Accept interfaces, return concrete types. A returned interface hides the type's other methods.
47. Do not write an interface until a second implementation, second consumer or test mock needs it. Start concrete.
48. Make the zero value useful. Guard lazily: `if r.items == nil { r.items = make(...) }`.
49. Use a comma-ok type assertion (`s, ok := v.(string)`). The single-value form panics. Assert to the smallest interface that has the behavior you need, not a concrete type.
50. In a type switch, list concrete types before interfaces (a later concrete case is unreachable). Add `case nil` when nil is valid input: nil does not match `default`.
51. Use errors.As, not a type assertion, on errors: assertions miss errors wrapped with `%w`.
52. Embed to promote the full API of the inner type. Use a named field when you only use a few methods internally. Promoted methods run on the inner type, not the outer one.
53. Use one receiver kind per type. If any method needs a pointer (mutation, a `sync.Mutex`, a large struct), use pointers on all. Value receivers suit small immutable types, basic types, maps and funcs.
54. Tag every exported field in a serialized struct (`json`, `db`, `yaml`). Without a tag, renaming the field silently changes the wire format. Unexported fields are never serialized.
55. `omitempty` drops `0`, `""` and `false`, so a real zero looks absent. Use a pointer or `omitzero` (Go 1.24+). `omitzero` also omits a zero `time.Time`.
56. Embed a `noCopy` sentinel (with `Lock()` and `Unlock()` methods) in structs that must not be copied, and pass them by pointer. `go vet` copylocks then flags every copy.

### Modernizing

57. Read the `go` directive in `go.mod` first. Do not use an API newer than that directive. Raise it deliberately.
58. Modernize only code you are touching. Do not start a wide rewrite inside an unrelated task. Mention other chances as a note.
59. Do safety fixes first, then readability, then the rest.
60. Replace `math/rand` with `math/rand/v2` (Go 1.22+). Note `Intn` became `IntN` and `Int63n` became `Int64N`. Drop `rand.Seed`.
61. Delete loop-variable copies (`v := v`) when `go.mod` says 1.22 or later: each iteration has its own variable.
62. Use `os.OpenRoot` (Go 1.24+) for user-supplied paths instead of `filepath.Clean` plus `HasPrefix`: it blocks traversal, including symlinks that leave the root.
63. Use `any` over `interface{}`. Use `min`, `max` and `clear` (1.21+). Use `slices` and `maps` over manual loops and `sort.Slice` (1.21+). Use `cmp.Or` for defaults (1.22+).
64. Use `strings.CutPrefix`, `CutSuffix` and `Cut` over `HasPrefix` plus `TrimPrefix`.
65. Use `sync.OnceValue` over `sync.Once` plus a global (1.21+). Use `sync.WaitGroup.Go` (1.25+). Use `errors.Join` over multi-error libraries (1.20+).
66. Use `t.Context()` and `b.Loop()` in tests and benchmarks (1.24+). Use `testing/synctest.Test` (1.25+), not the old `synctest.Run`.
67. Use `errors.AsType[T]` (1.26+) and `new(expr)` (1.26+) in place of `errors.As` plus a variable and of `ptr()` helpers.
68. Use `slog` for new logging (1.21+). Use `net.JoinHostPort` instead of `Sprintf("%s:%d")`, which breaks on IPv6.
69. Use `range` over iterators and `slices.Sorted(maps.Keys(m))` (1.23+). Use `strings.SplitSeq` and `Lines` (1.24+) to avoid allocating a slice.
70. Go 1.25+ already sets `GOMAXPROCS` from cgroup limits, so remove `automaxprocs`. Use `tool` directives in `go.mod` (1.24+) instead of `tools.go`.
71. Replace `runtime.SetFinalizer` with `runtime.AddCleanup` (1.24+). Replace `reflect.PtrTo` with `PointerTo`. Use `unsafe.Slice` and `unsafe.String` instead of `reflect.SliceHeader`.
72. Before bumping `go.mod` to 1.27, check for `godebug` or `//go:debug` lines that pin removed settings, such as `asynctimerchan` or `tlsrsakex`: the build fails. Also test `encoding/json/v2` strictness (duplicate keys and invalid UTF-8 are rejected) against real payloads.
73. After a toolchain upgrade, run `go fix ./...`. Go 1.27 runs the `stdversion` vet check in `go test`: fix a hit by raising the `go` directive or gating the API. Do not silence it.

## Patterns

```go
// Default, then override (rule 3).
level := slog.LevelInfo
switch {
case debug:
    level = slog.LevelDebug
case verbose:
    level = slog.LevelWarn
}

// Named booleans, expensive check last (rule 5).
isAdmin := user.Role == RoleAdmin
isOwner := res.OwnerID == user.ID
if isAdmin || isOwner || expensiveCheck(user, res) {
    allow()
}

// Consumer-owned interface, concrete return (rules 45, 46).
type Sender interface{ Send(to, body string) error } // in package notification
func NewService(s Sender) *Service { return &Service{sender: s} }

// Compile-time interface check, next to the type.
var _ io.ReadWriter = (*MyBuffer)(nil)

// Enum with a safe zero value (rule 41).
type Status int

const (
    StatusUnknown Status = iota
    StatusReady
    StatusDone
)

// Optional behavior through a small interface (rule 49).
if f, ok := w.(interface{ Flush() error }); ok {
    return f.Flush()
}

// noCopy sentinel (rule 56).
type noCopy struct{}

func (*noCopy) Lock()   {}
func (*noCopy) Unlock() {}

type ConnPool struct {
    noCopy noCopy
    mu     sync.Mutex
}
```

## Never

- `GetName()`, `this`, `ALL_CAPS`, `HttpServer`, `util` packages: use `Name()`, `s`, `MaxRetries`, `HTTPServer`, a specific package name.
- `http.HTTPClient` or `user.NewUser()`: drop the repeated word.
- A constructor that returns an interface: return the concrete type.
- A bare type assertion `v.(T)`: use `v, ok := v.(T)`.
- `err.(*MyError)` on a wrapped error: use `errors.As`.
- An interface with one implementation and no consumer need: delete it.
- An enum whose `iota` 0 is a real state: add `Unknown` first.
- An exported field in a JSON struct without a tag: add the tag.
- A mixed pointer and value receiver set on one type: pick pointers.
- A broad modernization sweep inside an unrelated change: note it, do not do it.
- `math/rand` with `rand.Seed` in new code: use `math/rand/v2`.

## Check before you report

- `gofmt -l .` (or `gofumpt -l .`) prints nothing.
- `go vet ./...` is clean. It covers `structtag` and `copylocks`.
- `golangci-lint run` passes. Useful linters: `revive`, `errname`, `predeclared`, `gocritic`, `misspell` and, for modernizing, `modernize` (golangci-lint v2.6.0+).
- `go build ./...` succeeds at the `go.mod` version: no API newer than the directive.
- `go test ./...` passes after any rename or modernization edit.
- Grep the diff for `Get[A-Z]`, `interface{}`, `v := v`, `rand.Seed` and unchecked `.(` assertions.
- For a JSON struct you changed, a marshal then unmarshal round-trip test passes.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-code-style, golang-naming, golang-structs-interfaces, golang-modernize. https://github.com/samber/cc-skills-golang
