---
name: hstack-go-tooling
description: "Go tooling: running and reading golangci-lint and nolint, gopls, go.mod and go.sum hygiene, dependency upgrades and CVE checks, godoc and README rules, CI essentials, and looking up a package on pkg.go.dev. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: tooling

Read this when you run linters or gopls, touch go.mod, add or upgrade a dependency, write doc comments, or set up CI.
First check what the project already uses. Do not install or adopt a tool the project does not use.

## Rules

### Find out what exists first

1. Look for `.golangci.yml`, `.github/workflows/`, a `Makefile`, `go.work`, and `tool` lines in `go.mod`. The project's own setup is the source of truth.
2. Check a tool is installed before you call it: `command -v golangci-lint gopls govulncheck`. If it is missing, say so. Do not install it unasked.
3. Match the project's `go` directive in `go.mod`. Do not use newer APIs than it allows, and do not bump it just to add a tool.

### Linting (golangci-lint)

4. Run `golangci-lint run ./...` after each significant change. Config lives in `.golangci.yml`. That file decides which linters run.
5. Read each issue as `file:line:col: message (linter-name)`. The name in brackets tells you which linter to look up.
6. Fix the cause first. Suppress only a confirmed false positive or an intentional pattern.
7. Write `//nolint:linter // reason`. Name the linter and give a reason. A bare `//nolint` hides everything on that line. The `nolintlint` linter flags both mistakes.
8. Do not suppress security or leak linters (`gosec`, `bodyclose`, `sqlclosecheck`, `rowserrcheck`) without a strong reason. They catch real resource leaks.
9. Do not suppress `errcheck`, `govet` or `staticcheck` on production paths. Those are usually real bugs.
10. Reasonable suppressions: `funlen` on table-driven tests, `gocyclo` on orchestration functions, `dupl` on deliberate parallel code, `exhaustive` with an intentional `default`.
11. With golangci-lint v2, use `golangci-lint fmt ./...` to format and `golangci-lint migrate` to convert a v1 config. A v2 config starts with `version: "2"`.
12. On a legacy codebase with many findings, set `issues.new-from-rev` so only new code is linted. Clean old code in separate steps.
13. "Deadline exceeded" means raise `run.timeout`. "Linter not found" usually means the installed version is older than the config expects. Check `golangci-lint linters`.

### gopls

14. Use gopls for meaning (types, references, implementations). Use grep for text. Before you change a definition, list its references.
15. After each edit, check for compile and analyzer errors on the changed files. Then run `go test` on the changed packages, not `./...`.
16. References only reflect the build configuration of the queried file. A query in `foo_windows.go` will not show matches in `bar_linux.go`. Re-run with the right `GOOS` or tags.
17. Call hierarchy shows static calls only. Calls through function values or interface methods are invisible. Cross-check with references.
18. gopls refuses a rename that would shadow a name or break interface satisfaction. That is a real hazard, not a bug. Investigate it.
19. The gopls CLI is documented as experimental, so treat it as a fallback. Positions are `file:line:col` (1-indexed, UTF-8 bytes) or `file:#offset`. Write commands take `-w` (write), `-d` (diff) and `-l` (list files).
20. Generated files marked `DO NOT EDIT` get no code actions. Edit the generator instead.

### go.mod and go.sum

21. Commit `go.sum`. It holds checksums of every dependency version, and `go mod verify` uses it to detect tampering.
22. Run `go mod tidy` before every commit that changes dependencies. It removes unused modules and adds missing ones.
23. Ask the user before `go get` adds a new dependency. Check first that the standard library cannot do the job, the license fits, and the module is maintained. Upgrading an existing one is fine.
24. Prefer `go get -u=patch ./...` for routine updates. Then run `go mod tidy`, `go test ./...`, `go vet ./...` and `govulncheck ./...`. Read release notes for anything touching persistence, serialization, networking, auth or crypto.
25. `go get -u ./...` skips test-only dependencies. Add `-t` to include them.
26. Remove a dependency with `go get pkg@none` then `go mod tidy`.
27. Go 1.24+ modules pin tools with `tool` directives: `go get -tool <pkg>`, run with `go tool <name>`. Use a `tools.go` blank-import file only for modules older than 1.24.
28. `replace` and `exclude` only take effect in the main module's `go.mod`. They are ignored when your module is a dependency. Remove `replace` lines to local paths before publishing a library.
29. Use `go.work` for local multi-module work instead of `replace`. Do not commit `go.work.sum`. `go.work` does not affect how consumers resolve your module.
30. `retract` marks a published version as bad. It stays downloadable, but `go get` will not pick it by default.
31. A v2+ module needs `/v2` in the `module` line and in every import path. Without it, importers cannot tell the major versions apart.

### Vulnerabilities and package lookup

32. `govulncheck` reports only vulnerabilities in code paths you actually call. Run it before a release and in CI. It also scans binaries: `govulncheck -mode=binary ./bin/app`.
33. To vet a package you have not added yet (versions, importers, licenses, CVEs), use pkg.go.dev, or `godig overview <path> -o md` if `godig` is installed. A high `imported-by` count is a rough sign of maturity.
34. gopls answers for your locally resolved build. pkg.go.dev answers for the published ecosystem. Use the right one.

### Doc comments

35. Every exported name needs a doc comment that starts with the name: `// Parse reads ...`. Every package needs a `// Package foo ...` comment.
36. Explain why, when to use it, constraints, and what can go wrong. Do not restate the signature.
37. Name each error a function returns and when. State whether it is safe for concurrent use if that matters.
38. Mark old API with a paragraph starting `Deprecated:` and name the replacement.
39. Indent code examples in comments by one tab. Put runnable examples in `ExampleXxx` functions in `_test.go` files, because `go test` verifies them.
40. Cut marketing words ("robust", "seamless") and invented future claims. Keep `must`, `should` and `may` as they are.
41. A README follows this order: title, badges, one-sentence summary, demo, getting started, features, contributing, license.

### CI essentials

42. Run `go test -race -shuffle=on ./...` in CI. `-race` catches data races. `-shuffle=on` exposes tests that depend on order.
43. Use `-count=1` for integration tests so cached results do not hide flaky service calls.
44. Check that `go mod tidy` leaves no diff: `go mod tidy && git diff --exit-code go.mod go.sum`.
45. Run `golangci-lint` and `govulncheck` on every pull request.
46. Set a test matrix from the `go` line in `go.mod` up to `stable`, with `fail-fast: false` so one failing version does not cancel the others.
47. Pin actions to a major version (`@vN`), never `@master`. Give each workflow a `permissions:` block with least privilege.
48. Never use `pull_request_target` with untrusted code. Never put secrets in workflow files.

## Patterns

Lint, fix and format:

```bash
golangci-lint run ./...
golangci-lint run --fix ./...
golangci-lint fmt ./...
golangci-lint run --enable-only govet ./...   # one linter
```

A justified suppression:

```go
//nolint:errcheck // fire-and-forget logging, error is not actionable
_ = logger.Sync()
```

Why a module is in the build, and what it costs:

```bash
go mod why -m github.com/some/module
go mod graph
go list -u -m all        # available updates
go mod verify
```

Routine dependency update:

```bash
go get -u=patch ./...
go mod tidy
go test ./... && go vet ./...
govulncheck ./...
```

Pin tools in a Go 1.24+ module:

```bash
go get -tool golang.org/x/vuln/cmd/govulncheck@latest
go tool govulncheck ./...
```

Fix a bad transitive dependency (temporary, main module only):

```bash
go get github.com/transitive/dep@v1.5.0
go mod edit -exclude=example.com/pkg@v1.3.0
```

Doc comment with a deprecation:

```go
// Fetch retrieves a user by ID. Use it for authenticated endpoints that need
// the full profile; use List for searches.
//
// Returns ErrNotFound if no user has this ID.
//
// Deprecated: use FetchContext, which honors cancellation.
func Fetch(id string) (*User, error)
```

Look up a package that is not yet in go.mod (only if `godig` exists):

```bash
godig overview github.com/samber/lo -o md
godig vulns github.com/samber/lo -o md
```

## Never

- Bare `//nolint`. Name the linter and give a reason.
- Suppressing a finding to make the build pass. Fix the cause, or report it.
- `go get` of a new dependency without asking. Check the standard library first.
- Deleting `go.sum` to "fix" a checksum error. Run `go mod tidy`, and investigate a real mismatch with `go mod verify`.
- Leaving a `replace` to a local path in a published library.
- A v2 tag without the `/v2` module path.
- Trusting a gopls "no references" result for code behind other build tags or reached through reflection. Grep too.
- `go test ./...` after every small edit in a large repo. Test the changed packages, then run everything once at the end.
- CI without `-race`, or actions pinned to `@master`.
- Adding golangci-lint, Dependabot or a CI file to a project that does not have them, unasked.

## Check before you report

- `command -v golangci-lint` found it, and `golangci-lint run ./...` is clean (or you list what remains and why).
- `go build ./... && go vet ./... && go test ./...` passes. Add `-race` if you touched concurrency.
- `go mod tidy && git diff --stat go.mod go.sum` shows only the changes you meant.
- `govulncheck ./...` ran if you changed dependencies. If the tool is missing, say that you could not run it.
- Every new `//nolint` names a linter and gives a reason: `grep -rn "nolint" --include=*.go . | grep -v "nolint:.*//"` finds the ones that do not.
- Every new exported name has a doc comment starting with its name. `go doc ./pkg` shows how it renders.
- You did not add a dependency, tool or CI file the project did not already use, unless the user agreed.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-lint, golang-gopls, golang-continuous-integration, golang-dependency-management, golang-pkg-go-dev, golang-documentation, golang-popular-libraries, golang-stay-updated. https://github.com/samber/cc-skills-golang
