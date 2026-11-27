---
name: hstack-go-refactor
description: "Go-specific refactoring: gopls rename and inline, gofmt -r, eg, go fix, extracting interfaces, breaking import cycles, moving types between packages with aliases, and keeping exported APIs compatible. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: refactor

Read this when you rename, move, split or reshape Go code without changing what it does.
It adds Go specifics to the general refactor guide: baseline first, characterization tests, small steps.

## Rules

### Process (Go flavor)

1. Start from a clean, committed, green baseline: `go build ./... && go vet ./... && go test ./...`. If a step turns the build red, revert to the last green commit instead of debugging forward.
2. Never mix structural and behavioral changes in one commit. A rename and a feature need different review.
3. Keep a move and an optimization in separate steps, even though both are structural. The move is proven by build and tests. The optimization needs benchmarks.
4. Measure test coverage on the code you will touch, not the project average: `go test -covermode=atomic -coverpkg=./... -coverprofile=cover.out ./...` then `go tool cover -func=cover.out`.
5. Go coverage is statement coverage, not branch coverage. A function at 100% can still have an untested `else` or `case`. Read the branches.
6. `go test ./...` leaves out packages that have no `_test.go` file. They do not show as 0%. `-coverpkg=./...` forces them into the report.
7. Low coverage on the touched lines: write characterization tests first. Record what the code does today, even if it looks wrong. Until a net exists, use only rename and inline.
8. To get a seam in untested code, add a small interface at the point of use and inject the real thing through the constructor. Go interfaces are satisfied implicitly, so the producer package does not change.
9. Pause and ask the user before: a cross-package move, a package split, any exported API change or deprecation, any deletion, a new major version, or touching code with no tests.
10. Skip the refactor when nothing planned will touch the code again, or there is no stated purpose.

### Pick the tool, least powerful first

11. Prefer tool-driven edits over hand edits. A hand edit across many call sites misses cases.
12. Rename with gopls (`gopls prepare_rename`, then `gopls rename -w <file:line:col> NewName`). It refuses renames that shadow a name or break interface satisfaction. Treat a refusal as a real problem.
13. gopls rename only protects compilation. It cannot see struct tags, `text/template` fields, or `reflect` dispatch. After renaming a field, grep for the old name in tags, templates and strings. A renamed field can silently drift from its `json` or `db` tag.
14. Inline a call with gopls: `gopls codeaction -kind=refactor.inline.call -exec -w <file:line:col>`. It puts side-effecting arguments into temporary variables rather than duplicating them.
15. Extract is less rigorous than rename and inline. Comments are sometimes dropped, so review the diff. Files marked `DO NOT EDIT` get no code actions.
16. Other gopls rewrites: fill struct, remove unused parameter, move parameter left or right, extract to new file. List them with `gopls codeaction -kind=refactor.rewrite <file>`. Only one action runs per invocation.
17. gopls code action kinds are hierarchical: `-kind=refactor` matches every `refactor.*` kind.
18. For a pattern repeated across many sites, climb in this order: `gofmt -r`, then `eg`, then `gopatch`, then a custom `go/analysis` fixer. A generated rewrite is reviewable and re-runnable.
19. `gofmt -r 'a -> b'` is syntactic and type-blind. Single lowercase letters are wildcards. It cannot tell two functions with the same name in different packages apart.
20. `eg` (golang.org/x/tools/cmd/eg) is type-aware, driven by a template with `before` and `after` functions. It handles expressions only. It adds imports but never removes them, so run `goimports` after.
21. `go fix ./...` applies the standard modernizers (Go 1.26 and later runs them on the `go/analysis` framework). A `//go:fix inline` comment on a deprecated function lets `go fix` inline every call site into the replacement.
22. Never use `sed` or `perl` for structural Go changes. They match inside strings and comments.
23. After any bulk rewrite, run `goimports -w .` (or `gofmt -l .` to list unformatted files), then build and test.
24. To find code orphaned by a removal, use `deadcode ./...` if installed. It is unsound for reflection, `go:linkname` and assembly, so treat "dead" as a strong hint, not proof.

### Interfaces and package boundaries

25. Define interfaces in the package that uses them, not in the one that implements them. Accept interfaces, return structs.
26. Do not add an interface with one implementation and no test need. Do not return an interface from a constructor "for flexibility". Both add indirection.
27. Break an import cycle with a consumer-side interface first. It needs no call-site changes. Next options, in order: move the shared type into a small leaf package, use an `internal/` package, then a mediator package.
28. Do not break a cycle by moving the producer's concrete type into the consumer's package. That usually just moves the cycle.
29. Before splitting a package, try moving declarations to a new file in the same package (gopls `refactor.extract.toNewFile`). That often makes it navigable with no import changes.
30. Replace `init()` and mutable package-level state with a constructor that takes its dependencies. The dependency becomes visible in the signature, and the code becomes testable.
31. Add a type parameter only when the logic is identical across types and it removes a type assertion. If behavior differs per type, even by one branch, use an interface. Go has no method-level type parameters, so fluent generic chains do not work.

### Moving types and keeping exported API compatible

32. Move a type across packages with an alias: `type Old = newpkg.New`. The `=` makes them the same type. Without it, `type Old newpkg.New` is a different type and breaks every caller.
33. Alias migration order: define the type in the new package, replace the old declaration with a deprecated alias, move callers one package at a time, then delete the alias once nothing references it. Aliases can carry type parameters since Go 1.24.
34. A moved function can stay as a thin wrapper. A moved variable or constant can be re-declared to point at the new one.
35. Deprecate before you delete. Use a `// Deprecated: use X instead.` paragraph. Land the deprecation, let a release pass, delete later. Do both in one PR and downstream modules break with no warning.
36. Prefer additive changes: a new function, method or optional field. A change that breaks callers needs a new major version.
37. A v2+ module needs `/v2` in the `module` line and in every import path. During migration, v2 can wrap v1 so there is one copy of the logic.
38. A shipped bad version is marked with `retract` in `go.mod`. Do not delete it from the proxy.

## Patterns

Rename and inline with gopls (positions are 1-indexed `file:line:col`):

```bash
gopls prepare_rename pkg/user.go:12:6
gopls rename -w pkg/user.go:12:6 Account
gopls codeaction -kind=refactor.inline.call -exec -w pkg/user.go:40:9
```

Bulk rewrite of one expression shape:

```bash
gofmt -r 'bytes.Compare(a, b) == 0 -> bytes.Equal(a, b)' -w .
gofmt -s -d .          # show simplifications without writing
```

Consumer-side interface (the producer type already satisfies it):

```go
// package report, the consumer
type rowQuerier interface {
	QueryRowContext(ctx context.Context, q string, args ...any) *sql.Row
}

func NewReport(db rowQuerier) *Report { return &Report{db: db} }
```

Move a type with an alias:

```go
// newpkg
type Account struct{ /* real fields */ }

// oldpkg
// Deprecated: use newpkg.Account.
type User = newpkg.Account
```

Fast safety net after each step:

```bash
go build ./... && go vet ./... && go test ./...
go test -race ./...    # if the step touched concurrency
```

Benchmark proof for a hot path (same command before and after):

```bash
go test -bench=. -benchmem -count=10 ./pkg > old.txt   # before
go test -bench=. -benchmem -count=10 ./pkg > new.txt   # after
benchstat old.txt new.txt                              # "~" means no change
```

Find what a change will touch:

```bash
gopls references pkg/user.go:12:6
go mod graph | grep some/module      # blast radius across modules
```

## Never

- Rename by find and replace, or by hand across files. Use `gopls rename`, then grep for tags and templates.
- Force a rename that gopls refused. Find the shadowing or interface conflict.
- Write `type Old New` when you mean an alias. Write `type Old = New`.
- Delete an exported symbol in the same PR that deprecates it. Deprecate, release, then delete.
- Bump to v2 without the `/v2` path suffix.
- Move code and change its behavior in one commit. Split them.
- Trust a coverage percentage for the whole project. Check the touched functions and branches.
- Refactor untested critical code directly. Write characterization tests, then get sign-off.
- Run `sed` over Go source for structural changes.
- Leave a refactor red and keep going. Revert to the last green commit.
- Create a new interface or package split "for testability" when a function parameter or a small seam would do.

## Check before you report

- `go build ./... && go vet ./... && go test ./...` passes after the last step, and the baseline was green before the first.
- `gofmt -l .` prints nothing, and imports are tidy (`goimports -l .` if available).
- Each commit or step is purely structural or purely behavioral. Say which.
- After a rename: `grep -rn "OldName" .` finds no leftover use in struct tags, templates, strings, docs or generated files.
- For exported API changes: `git diff` shows old names still compile (aliases or wrappers), carry `Deprecated:` notes, and no exported symbol was deleted without sign-off.
- For concurrency or hot-path changes: `go test -race ./...` is clean, and `benchstat old.txt new.txt` shows `~`.
- You asked the user before any cross-package move, package split, deletion, or major-version change.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-refactoring. https://github.com/samber/cc-skills-golang
