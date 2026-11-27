---
name: hstack-go-security
description: "Go security: injection (SQL, command, template, XSS, SSRF), crypto and passwords, secrets, input limits, HTTP server hardening, cookies, JWT, file paths and archives, deserialization, log hygiene, govulncheck and gosec. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: security

Read this before you write or review Go code that touches user input, SQL, shell commands, files, HTML, crypto, secrets, cookies, tokens or outbound HTTP. It covers the Go-specific way to do each one safely. Ownership checks and general auth design live in the general hstack security guide.

## Rules

1. Ask three questions first: where does untrusted data enter, what can the attacker control, what is the worst outcome if this fails. Trace the data back to its origin before you call something a bug.
2. Use placeholders for every SQL value (`$1` for pgx and lib/pq, `?` for MySQL and SQLite). Concatenated SQL lets the attacker change the query. A numeric value built with `strconv` is safe but still use a placeholder, for consistency.
3. Placeholders cannot bind identifiers or keywords. For `ORDER BY` and column names, map the user value through an allowlist and fall back to a default. Never `Sprintf` the raw value.
4. Build `IN (...)` lists with generated placeholders (or `sqlx.In` plus `db.Rebind`). Never join user strings.
5. Build dynamic `WHERE` clauses by appending fixed fragments and bound args. The fragments come from your code, the values come from args.
6. Run commands with `exec.CommandContext(ctx, "prog", arg1, arg2)`. Never `sh -c` or `bash -c` with user text: the shell interprets `;`, `|` and backticks. Validate file names with `filepath.Base(name) == name`.
7. Render HTML with `html/template`. It escapes by context (HTML, attribute, JS, URL). `text/template` does not escape, so never use it for HTML. Never build HTML with `fmt.Sprintf` and `w.Write`. If you must write a bare string into HTML, use `html.EscapeString`.
8. Do not generate Go code, XPath or template source from user input. Pick from a fixed allowlist of names instead.
9. Use `crypto/rand` for tokens, session IDs, salts, nonces and keys. `math/rand` output is predictable. Check the error from `rand.Read` and fail closed.
10. Hash passwords with Argon2id (`golang.org/x/crypto/argon2`, OWASP-style params: time 3, memory 64 MiB, threads 4, 16-byte salt, 32-byte key) or bcrypt. scrypt and PBKDF2 (600,000+ iterations) are acceptable. Never MD5, SHA-1 or plain SHA-256 for passwords: they are fast, so they are cheap to brute-force.
11. For encryption use AES-GCM or ChaCha20-Poly1305 through `cipher.NewGCM` or `chacha20poly1305`. Never use `block.Encrypt` directly (that is ECB and leaks patterns). Never use DES, 3DES or RC4.
12. Use a fresh random nonce for every GCM encryption, stored in front of the ciphertext. A reused nonce breaks both secrecy and authentication.
13. Use SHA-256 or better for general hashing and HMAC (`hmac.New(sha256.New, key)`). Avoid MD5 and SHA-1 for any security use. Use RSA 2048 bits or more, or Ed25519 and ECDSA P-256.
14. Compare secrets, tokens and MACs in constant time: `subtle.ConstantTimeCompare` for tokens, `hmac.Equal` for MACs, `bcrypt.CompareHashAndPassword` for passwords. `==` stops at the first different byte and leaks timing.
15. Use envelope encryption when keys must rotate: a random data key encrypts the data, a master key encrypts the data key. Rotating the master key then re-wraps only the small data keys.
16. Set `tls.Config{MinVersion: tls.VersionTLS12}`. Never set `InsecureSkipVerify: true`, and never `ssh.InsecureIgnoreHostKey()` (use `ssh.FixedHostKey` or known_hosts).
17. Never hardcode secrets, DSNs or passwords. Read them from env vars or a secret manager at startup, fail with a clear error if one is missing, and use separate secrets per environment. Add `.env`, `*.key`, `*.pem`, `*.p12` and `secrets/` to `.gitignore`.
18. Do not log secrets or personal data. Never log a whole struct with `%+v`; log chosen fields with `log/slog`. Strip control characters (especially newlines) from user text before you log it, to stop log injection.
19. Return a generic message to clients (`http.Error(w, "internal error", 500)`) and log the real error server-side. Database errors and stack traces reveal schema and paths.
20. Redact before sending data to third parties (Sentry, analytics, tracing). Use a `BeforeSend` hook to drop `Authorization` and `Cookie` headers. Send internal IDs, never emails or phone numbers.
21. Build every `http.Server` with `ReadHeaderTimeout` or `ReadTimeout`, `WriteTimeout`, `IdleTimeout` and `MaxHeaderBytes`. The bare `http.ListenAndServe` has no timeouts, so slow clients (Slowloris) hold connections open.
22. Cap request bodies with `http.MaxBytesReader(w, r.Body, n)` before you decode. Decode JSON into a typed struct, and call `DisallowUnknownFields` when the shape is strict. Validate with allowlists at the boundary and enforce length limits.
23. Rate limit login, signup, password reset and expensive endpoints (`golang.org/x/time/rate`, one limiter per client key). Evict idle limiter entries so the map does not grow forever.
24. Set security headers in one middleware: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS with `includeSubDomains`, `Referrer-Policy`, `Permissions-Policy`.
25. Session and auth cookies need `HttpOnly`, `Secure`, `SameSite` Lax or Strict (None only when cross-site is required, and it needs `Secure`), a short `MaxAge`, and no `Domain` unless required. Use the `__Host-` prefix when you can (Secure, Path `/`, no Domain). Clear the cookie on logout. Rotate the session ID at login.
26. Validate JWTs fully: pin the signing method in the key func (stops algorithm confusion, RS256 to HS256), then require issuer, audience and expiry (`jwt.WithIssuer`, `jwt.WithAudience`, `jwt.WithExpirationRequired`). Use short-lived access tokens.
27. Never trust client headers for identity or role (`X-Is-Admin`, `X-Forwarded-For`). Take identity from the verified token or session in the request context, and check permissions server-side on every handler.
28. Validate redirect targets. Allow only relative paths that start with a single `/` (not `//`), or hosts on an allowlist. A scheme check alone is not enough.
29. Stop SSRF on outbound requests: allow only http and https, allowlist hosts, and block loopback, private, link-local and cloud metadata addresses. Check the resolved IP at dial time (a `net.Dialer.Control` hook), not just the hostname string, so DNS tricks and redirects cannot bypass the check.
30. Never expose `net/http/pprof` publicly. Import it only behind a build tag, or serve it on a separate listener bound to `127.0.0.1`. Bind services to a specific interface when they are not public.
31. Confine user-controlled file paths to a root. On Go 1.24+ use `os.OpenRoot(dir)` and `root.Open`, `root.Create` and friends: they reject `..` and symlinks that escape. `os.Root` is not a full sandbox (bind mounts, device files), so still reject special files in uploads and archives.
32. Before Go 1.24, check `filepath.IsLocal(p)`, join, then `filepath.Rel` and reject `..`. Never rely on `filepath.Clean` plus `strings.HasPrefix`: `/data/app2` passes a prefix check for `/data/app`. Even the lexical check does not follow symlinks.
33. When you extract zip or tar files, validate every entry name (ZipSlip), reject symlinks and devices, and cap total decompressed bytes. `io.LimitReader` hides the overflow as a clean EOF, so use a reader that returns a sentinel error when the limit is hit, or compare the byte count after copy.
34. Create temp files with `os.CreateTemp` (random name, mode 0600), never a fixed `/tmp/app.tmp`. Use mode 0600 for secret files, 0640 for logs, 0750 for directories. Never 0777 or 0666.
35. Do not decode untrusted input with `encoding/gob`. Use JSON into typed structs and validate the fields. Reject `<!DOCTYPE` and `<!ENTITY` in untrusted XML before decoding.
36. Check integer math on external sizes before you allocate. `rows * cols` can overflow. Guard with `a > math.MaxInt/b` and a maximum size. Bound `big.Rat` and `big.Int` growth when inputs drive the loop.
37. Do not use `unsafe` in application code. Run the race detector in CI: a data race can break an authorization check under load. Protect shared state with `sync.Mutex`, `sync/atomic` or channels.
38. Validate with anchored regexes (`^...$`) and compile them once at package level. Unanchored or loose patterns accept hostile input.
39. Never ignore a crypto or security error (`_, _ = encrypt(x)`). Fail closed.
40. Do not write your own crypto. Use the standard library or `golang.org/x/crypto`. On Go 1.24+ prefer stdlib `crypto/pbkdf2`, `crypto/hkdf` and `crypto/sha3`.

## Patterns

Dynamic `ORDER BY` through an allowlist.

```go
var sortCols = map[string]string{"name": "name", "created": "created_at", "email": "email"}

col, ok := sortCols[sortKey]
if !ok {
    col = "created_at"
}
q := "SELECT id, name FROM users ORDER BY " + col // col comes from the map, not the user
```

Dynamic `WHERE` with bound args.

```go
var conds []string
var args []any
if name != "" {
    args = append(args, name)
    conds = append(conds, fmt.Sprintf("name = $%d", len(args)))
}
if minAge > 0 {
    args = append(args, minAge)
    conds = append(conds, fmt.Sprintf("age >= $%d", len(args)))
}
q := "SELECT id, name FROM users"
if len(conds) > 0 {
    q += " WHERE " + strings.Join(conds, " AND ")
}
rows, err := db.QueryContext(ctx, q, args...)
```

Command with separate args.

```go
cmd := exec.CommandContext(ctx, "convert", inPath, "-resize", "200x200", outPath)
```

AES-GCM with a random nonce stored in front.

```go
func seal(key, plaintext []byte) ([]byte, error) {
    block, err := aes.NewCipher(key) // 32-byte key for AES-256
    if err != nil {
        return nil, err
    }
    aead, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    nonce := make([]byte, aead.NonceSize())
    if _, err := rand.Read(nonce); err != nil {
        return nil, err
    }
    return aead.Seal(nonce, nonce, plaintext, nil), nil
}

func open(key, data []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, err
    }
    aead, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    if len(data) < aead.NonceSize() {
        return nil, errors.New("ciphertext too short")
    }
    n := aead.NonceSize()
    return aead.Open(nil, data[:n], data[n:], nil)
}
```

Constant-time checks.

```go
if subtle.ConstantTimeCompare([]byte(got), []byte(want)) != 1 { /* reject */ }
if !hmac.Equal(gotMAC, wantMAC) { /* reject */ }
```

Hardened server.

```go
srv := &http.Server{
    Addr:              ":8080",
    Handler:           handler,
    ReadHeaderTimeout: 5 * time.Second,
    ReadTimeout:       10 * time.Second,
    WriteTimeout:      15 * time.Second,
    IdleTimeout:       120 * time.Second,
    MaxHeaderBytes:    1 << 20,
}
// in a handler: r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
```

Scoped file access (Go 1.24+).

```go
root, err := os.OpenRoot("/var/www/public")
if err != nil {
    return err
}
defer root.Close()
f, err := root.Open(userPath) // cannot escape the root
```

Pinned JWT validation.

```go
tok, err := jwt.ParseWithClaims(raw, &jwt.RegisteredClaims{},
    func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
            return nil, fmt.Errorf("unexpected alg %v", t.Header["alg"])
        }
        return publicKey, nil
    },
    jwt.WithIssuer(issuer), jwt.WithAudience(aud), jwt.WithExpirationRequired())
```

## Never

- `fmt.Sprintf("... WHERE x = '%s'", v)`: use `$1` and pass `v` as an arg.
- `exec.Command("sh", "-c", "rm "+name)`: pass the program and its args separately.
- `text/template` or string concatenation for HTML: use `html/template`.
- `math/rand` for tokens: use `crypto/rand`.
- `==` on secrets: use `subtle.ConstantTimeCompare` or `hmac.Equal`.
- A fixed or reused GCM nonce: generate a random one for each message.
- `InsecureSkipVerify: true`, `TLS10`, `InsecureIgnoreHostKey()`: verify certificates and host keys.
- `http.ListenAndServe(addr, h)` in production: build an `http.Server` with timeouts.
- `http.Get(r.URL.Query().Get("url"))`: validate and allowlist, and check the dialed IP.
- `filepath.Join(base, userInput)` with no check: use `os.OpenRoot` or `filepath.IsLocal`.
- `import _ "net/http/pprof"` on the public mux: use a build tag or a localhost listener.
- `log.Printf("%+v", user)` or `err.Error()` in the response body: log selected fields, return a generic message.
- Secrets in source, in `.env` files that are committed, or shared across environments: use env vars or a secret manager.
- `jwt` key func that returns the key without checking the method: pin the algorithm.
- Trusting `X-Forwarded-For` or a role header: derive identity server-side, and trust proxy headers only from known proxies.

## Check before you report

- `govulncheck ./...` passes (known CVEs in reachable dependencies and the Go toolchain).
- `gosec ./...` has no new findings, or each skipped one has a `// security:` comment that says why it is safe.
- `go test -race ./...` passes.
- `go vet ./...` and `golangci-lint run` are clean (`errcheck`, `bodyclose`, `sqlclosecheck`, `nilerr`, `staticcheck`).
- `grep -rnE 'math/rand|InsecureSkipVerify|sh", "-c|Sprintf\("[^"]*(SELECT|INSERT|UPDATE|DELETE)' --include=*.go .` shows no unexplained hit in non-test code.
- Every new `http.Server` has timeouts, and every new endpoint has a body size cap and a server-side permission check.
- Parsers of untrusted input have a fuzz test: `go test -fuzz=FuzzName -fuzztime=30s ./pkg`.
- No secret, token or personal data appears in logs, error responses or third-party payloads.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-security. https://github.com/samber/cc-skills-golang
