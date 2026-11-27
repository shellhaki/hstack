---
name: hstack-go-testing
description: "Go testing: table-driven tests, subtests, parallel tests, helpers, mocks and fakes, httptest, integration tags, fuzzing, benchmarks, examples, coverage, goroutine-leak and time tests, plus testify when the project uses it. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: testing

Read this when you write, review, or debug Go tests.
Tests are executable specifications. They pin behavior. They do not exist to hit a coverage number.

## Rules

Structure
1. Name the test file after the source file: `foo.go` has `foo_test.go`. Never name it after one function. Tools and reviewers map tests by file.
2. Order test functions in the same order as the functions they test.
3. Same-package tests (`package foo`) can reach unexported names. External tests (`package foo_test`) check only the public API. Prefer external tests.
4. Names: `TestAdd`, `TestStore_Get` (method), `BenchmarkAdd`, `ExampleAdd`, `FuzzAdd`.
5. Test observable behavior and the public contract, not internals. Internals-coupled tests break on every refactor and prove nothing.
6. Every test must run alone and in any order. No shared mutable state between tests.

Table-driven tests
7. Give every case a `name` and run it with `t.Run(tt.name, ...)`. Unnamed cases make failures unreadable.
8. Cover edge cases and error paths in the table: zero, empty, nil, boundary, and invalid input. Not just the happy path.
9. Failure messages show input, got, and want: `t.Errorf("F(%d) = %v, want %v", in, got, want)`.
10. Use `t.Fatalf` when the test cannot continue (a nil result you are about to dereference). Use `t.Errorf` otherwise to see all failures.
11. Call `t.Helper()` first in every helper so failures point at the caller. Make helpers take `testing.TB` when benchmarks use them too.

Parallel and isolation
12. Add `t.Parallel()` to independent tests and subtests. Loop variables are per-iteration from Go 1.22. Before 1.22, copy `tt := tt`.
13. A test that calls `t.Setenv` or changes process-global state cannot be parallel.
14. Use `t.TempDir()` for files, `t.Cleanup()` for teardown, `t.Setenv()` for env vars. They clean up on their own.
15. Go 1.24+: `t.Context()` gives a context that is cancelled when the test ends.
16. Run `go test -race` in CI. Parallel tests are where races show up.

Doubles
17. Mock interfaces, not concrete types. Define the interface where it is consumed (the caller package), keep it small, and hand-write a fake or use a mock library.
18. Prefer a simple fake (in-memory implementation) when behavior matters. Use a mock when you must assert calls.
19. Do not mock time with `time.Sleep`. Inject a clock (`clockwork` or your own interface), or use `testing/synctest`.
20. Put shared test data in a `fixtures` package or `testdata/` directory. `testdata/` is ignored by the Go tool.
21. HTTP handlers: use `httptest.NewRequest` and `httptest.NewRecorder`, call `handler.ServeHTTP`, and assert `w.Code`, headers, and body. No real server needed.

Time and goroutines
22. Go 1.25+: `testing/synctest.Test(t, func(t *testing.T){...})` runs code in a bubble with a fake clock. Time moves only when all goroutines block. Use `synctest.Wait()` to let them settle. Do not use the old Go 1.24 `synctest.Run` API in 1.25+ code.
23. In packages that start goroutines, add `goleak.VerifyTestMain(m)` (`go.uber.org/goleak`) in `TestMain`, or `defer goleak.VerifyNone(t)` per test.
24. For tests that may hang, set `-timeout` on the command, or use a watchdog that panics with the test location.

Integration
25. Mark integration tests with `//go:build integration` and run them with `go test -tags=integration ./...`. Unit tests stay fast (aim under a few milliseconds) and need no network or database.
26. Reset state per test (truncate tables, fresh temp dir). Wait for services with a health check, not a fixed `time.Sleep`.
27. Coverage by default counts only the package under test. Add `-coverpkg=./...` to see cross-package coverage. Integration tests show up only if you pass the tag.

Fuzz, benchmarks, examples, coverage
28. Fuzz with `f.Add` seeds and `f.Fuzz`. Assert properties (round trip, no panic, invariants), not fixed outputs.
29. Benchmarks: use `b.Run` per variant so each has its own name. Use `for b.Loop()` on Go 1.24+ (setup stays outside the timed region and the body is not optimized away). Use `b.N` only for older modules. Add `b.ReportAllocs()` when allocations matter.
30. `ExampleXxx` functions run in `go test` and compare stdout to `// Output:`. Use `// Unordered output:` for map or concurrent output. With no output comment, the example only compiles.
31. Example names: `ExampleStore_Get_cached`. The part after the last underscore must start with a lowercase letter, or the example detaches from its symbol.
32. Coverage finds untested paths. A line that ran is not a line that was asserted. Do not chase a percentage.
33. Go 1.26+: `t.ArtifactDir()` is the place to write files a test wants to keep for inspection.

## If the project uses testify

Use it as a helper on top of `testing`. Always keep `*testing.T` as the entry point.
34. `require` stops the test (`FailNow`). Use it for preconditions: errors, nil checks, setup. `assert` records and continues. Use it for the actual checks.
35. Argument order is always `(expected, actual)`. Swapped order gives backwards diffs.
36. Build `assert.New(t)` inside each `t.Run` closure, from that subtest's own `t`. If you build it in the parent, failures are attributed to the parent and the subtest still prints PASS.
37. Use `ErrorIs` and `ErrorAs` for errors. `Equal(ErrX, err)` fails on wrapped errors.
38. `Equal` on pointers compares addresses. Compare the values, or use `EqualExportedValues`.
39. `ElementsMatch` for unordered slices, `InDelta` for floats, `JSONEq` for JSON, `WithinDuration` for times, `Eventually` or `EventuallyWithT` for async state.
40. Mocks: embed `mock.Mock`, implement each method with `m.Called(...)`, and always call `m.AssertExpectations(t)`. Without it, unmet expectations pass silently. Matchers: `mock.Anything`, `mock.AnythingOfType("T")`, `mock.MatchedBy(fn)`. Modifiers: `.Once()`, `.Times(n)`, `.Maybe()`, `.Run(fn)`, `.Unset()`. Also `AssertCalled`, `AssertNotCalled`, `AssertNumberOfCalls`.
41. For a mock that can return nil, check `args.Get(0) == nil` before the type assertion.
42. Suites: embed `suite.Suite`. Order is `SetupSuite`, `SetupTest`, `TestXxx`, `TearDownTest`, `TearDownSuite`. You must add `func TestX(t *testing.T){ suite.Run(t, new(XSuite)) }`, or zero tests run silently. Use `s.Require()` for require-style checks.
43. Lint with `testifylint` to catch swapped args and assert/require misuse.

## Patterns

Table-driven test with named subtests (standard library only):
```go
func TestCalculatePrice(t *testing.T) {
    tests := []struct {
        name      string
        qty       int
        unitPrice float64
        want      float64
    }{
        {"single item", 1, 10, 10},
        {"bulk discount", 100, 10, 900},
        {"zero quantity", 0, 10, 0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            got := CalculatePrice(tt.qty, tt.unitPrice)
            if got != tt.want {
                t.Errorf("CalculatePrice(%d, %.2f) = %.2f, want %.2f", tt.qty, tt.unitPrice, got, tt.want)
            }
        })
    }
}
```

Hand-written fake behind a consumer-side interface:
```go
type userStore interface { Get(ctx context.Context, id string) (*User, error) }

type fakeStore struct{ users map[string]*User }

func (f fakeStore) Get(_ context.Context, id string) (*User, error) {
    u, ok := f.users[id]
    if !ok {
        return nil, ErrNotFound
    }
    return u, nil
}
```

Handler test:
```go
req := httptest.NewRequest(http.MethodPost, "/users", strings.NewReader(body))
req.Header.Set("Content-Type", "application/json")
w := httptest.NewRecorder()
CreateUserHandler(w, req)
if w.Code != http.StatusCreated {
    t.Fatalf("status = %d, want %d", w.Code, http.StatusCreated)
}
```

Deterministic timeout test (Go 1.25+):
```go
synctest.Test(t, func(t *testing.T) {
    ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
    defer cancel()
    time.Sleep(5 * time.Second)
    synctest.Wait()
    if !errors.Is(ctx.Err(), context.DeadlineExceeded) {
        t.Fatalf("ctx.Err() = %v, want DeadlineExceeded", ctx.Err())
    }
})
```

Sub-benchmarks:
```go
func BenchmarkJoin(b *testing.B) {
    for _, n := range []int{10, 100, 1000} {
        b.Run(fmt.Sprintf("n=%d", n), func(b *testing.B) {
            b.ReportAllocs()
            for b.Loop() {
                Join(n)
            }
        })
    }
}
```

Fuzz round trip:
```go
func FuzzReverse(f *testing.F) {
    f.Add("hello")
    f.Add("")
    f.Fuzz(func(t *testing.T, s string) {
        if got := Reverse(Reverse(s)); got != s {
            t.Errorf("Reverse(Reverse(%q)) = %q", s, got)
        }
    })
}
```

testify with a per-subtest instance:
```go
t.Run(tt.name, func(t *testing.T) {
    is := assert.New(t) // from the subtest's own t
    is.Equal(tt.want, Do(tt.in))
})
```

## Never

- Table cases with no `name`. Add one and use `t.Run`.
- `assert.New(t)` in the parent test, reused in `t.Run`. Build it inside the closure.
- `time.Sleep` to wait for goroutines or state. Use `synctest`, a channel, `Eventually`, or an injected clock.
- Tests that depend on order or on state left by another test. Make each self-contained.
- Asserting private fields, call order, or log text when the public result is enough. Assert the contract.
- A mock with no `AssertExpectations(t)`. Add it, or the expectations never check.
- Integration tests with no build tag in the default `go test ./...` run. Tag them.
- Chasing 100% coverage with tests that call code and assert nothing. Assert results.
- Naming a test file after a function (`abcd_test.go`). Use the source file name.
- Silencing a failing test with `t.Skip` or a retry loop to get green. Find the cause.

## Check before you report

- `go test ./...` passes. Show the real output, not a claim.
- `go test -race ./...` passes (add `-count=1` to skip the cache).
- Run a new or changed test alone: `go test -run 'TestName/subcase' -v ./pkg`. Confirm the case names print.
- Break the code on purpose (or the expected value) once and confirm the new test fails. A test that cannot fail is not a test.
- `go test -shuffle=on -count=3 ./...` to catch order dependence and flakiness.
- `go test -cover ./...`, and `go tool cover -func=coverage.out` after `-coverprofile=coverage.out`, to read the uncovered lines of the code you changed.
- `go test -tags=integration ./...` if you touched integration tests.
- `go vet ./...` and `golangci-lint run` if configured (`thelper`, `paralleltest`, `testifylint`).

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-testing, golang-stretchr-testify. https://github.com/samber/cc-skills-golang
