---
name: hstack-go-database
description: "Go database access: database/sql, sqlx and pgx, parameterized queries, ErrNoRows, rows.Close and rows.Err, NULL columns, transactions and isolation, locking, context timeouts, connection pool settings, batching, pagination, testing database code. Part of the hstack Go skill: loaded on demand through languages/go/SKILL.md, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Go: database

Read this before you write or change Go code that queries a SQL database. It covers how to use `database/sql` and its helpers correctly. Schema design, migrations and ownership checks live in the general hstack data and security guides.

## Rules

1. Use plain `database/sql`, plus `sqlx` or `pgx` for scanning ergonomics. Prefer `pgx` for PostgreSQL-only code (COPY, LISTEN, arrays) and `sqlx` or `database/sql` when you need portability. Do not add an ORM: it hides SQL, hides N+1 queries and adds hooks that make debugging hard.
2. Use placeholders for every value (`$1` for PostgreSQL, `?` for MySQL and SQLite). Never concatenate or `Sprintf` user input into SQL. Placeholders cannot bind table or column names, so allowlist those. See the Go security guide for `IN` lists and dynamic filters.
3. Call the `*Context` variant of every operation: `QueryContext`, `QueryRowContext`, `ExecContext`, `BeginTx`, `PingContext` (and `GetContext` and `SelectContext` in sqlx). The non-context calls ignore client disconnects and deadlines.
4. Pass the request context down. Add a timeout for slow paths (`context.WithTimeout`) and `defer cancel()`. Batch jobs get their own longer timeout, not none.
5. Handle `sql.ErrNoRows` with `errors.Is`. Translate it to a domain error (`ErrNotFound`), or to a `(value, found bool, err)` result when "missing" is normal. Wrap every other error with `%w` and context. `QueryRow` and `Get` return `ErrNoRows` from `Scan`; `Query` and `Select` return an empty result instead.
6. Close rows right after the error check: `defer rows.Close()`. After the loop, always check `rows.Err()`. `rows.Next()` returns false on both "done" and "failed", so skipping `rows.Err()` returns a silently truncated list.
7. Use `Exec` for statements that return no rows (INSERT, UPDATE, DELETE without RETURNING). `Query` returns `*Rows`; if you forget to close it, the connection never goes back to the pool.
8. When you update or delete, check `RowsAffected()` if "zero rows" is a failure (for example optimistic locking or a missing record). Run the ownership filter in the same `WHERE` clause (`WHERE id = $1 AND user_id = $2`).
9. Scan NULLable columns into pointers (`*string`, `*time.Time`) or `sql.Null[T]` (Go 1.22+) and `sql.NullString` and friends. Scanning NULL into a plain `string` or `int` fails with a conversion error. Pointers marshal to JSON `null`; `sql.NullXxx` needs custom marshaling. `COALESCE` in SQL is a third option.
10. List columns explicitly. Avoid `SELECT *`: it fetches extra data and breaks struct scanning when the schema changes. Tag sqlx fields with `db:"col"`; use `pgx.CollectRows` with `pgx.RowToStructByName[T]` in pgx v5.
11. Wrap related writes in one transaction: `tx, err := db.BeginTx(ctx, nil)`, then `defer tx.Rollback()` on the very next line, then `tx.Commit()` and check its error. Rollback after Commit is a harmless no-op, so the deferred call covers every early return and panic.
12. Run every statement of the unit of work on `tx`, not `db`. A call on `db` uses another connection, outside the transaction, and can deadlock against your own locks.
13. Keep transactions short. Do not call HTTP APIs, send emails or wait on user input inside one. An open transaction holds a connection and its locks.
14. Pass the transaction to helpers through a small interface (`ExecContext`, `QueryContext`, `QueryRowContext`) so the same repository code runs on `*sql.DB` and `*sql.Tx`.
15. Use `SELECT ... FOR UPDATE` when you read a value, compute from it and write it back (balances, stock). Without the lock, two requests read the same stale value. `FOR UPDATE NOWAIT` fails at once instead of waiting; `FOR SHARE` blocks writers but allows readers. Prefer a single atomic statement (`UPDATE ... SET qty = qty - $1 WHERE id = $2 AND qty >= $1`) when it is enough.
16. Pick the isolation level on purpose. The default (READ COMMITTED on PostgreSQL) fits most work. Use `sql.LevelRepeatableRead` for consistent reads in one transaction. Use `sql.LevelSerializable` for strict consistency such as money or inventory.
17. Retry the whole transaction (not just the failed statement) on a serialization failure (PostgreSQL code `40001`) or a deadlock, with a small bounded backoff. This is only safe when the transaction body is idempotent or fully rolled back.
18. Detect unique violations from the driver error code (for example `*pgconn.PgError` with code `23505`, or `pq.Error`), then return a conflict error. Do not match on message text.
19. Do not return raw database errors to clients. Log them, and return a generic message.
20. Configure the pool on every `*sql.DB`. Set `SetMaxOpenConns`, `SetMaxIdleConns` (not above max open), `SetConnMaxLifetime` and `SetConnMaxIdleTime`. Defaults allow unlimited open connections and can exhaust the database. Start near 25 open, 10 idle, 5 minutes lifetime, 1 minute idle time, and size max open to the database limit divided by the number of app instances.
21. `sql.Open` does not connect. Call `db.PingContext(ctx)` at startup so a bad DSN fails fast. Create one `*sql.DB` per database at startup, share it, and close it on shutdown. Never open a new `*sql.DB` per request.
22. Watch `db.Stats()`: `InUse`, `Idle`, `WaitCount`, `WaitDuration`. A `WaitCount` that keeps growing means the pool is exhausted: fix slow queries or raise max open. A leaked `Rows` or `Tx` shows up as `InUse` stuck high.
23. Batch writes in groups of about 100 to 1,000 rows, smaller for wide rows. Row-by-row means too many round trips; one giant statement holds locks, uses memory and can time out. Use `pgx` `CopyFrom` for large PostgreSQL loads.
24. Page with a cursor (`WHERE created_at > $1 ORDER BY created_at LIMIT 100`), not a large `OFFSET`, which re-scans every skipped row. Always pair `LIMIT` with `ORDER BY`, and use a unique tiebreaker column (like `id`) in the cursor.
25. Remove N+1 queries: use a `JOIN` or one `WHERE id IN (...)` query instead of a query in a loop. Use `EXISTS`, not `COUNT`, for existence checks. Run `EXPLAIN ANALYZE` before you tune anything.
26. Use an external migration tool (golang-migrate, Atlas, Flyway) with SQL that a human reviews and that is versioned in source control. Do not create tables or change them from application code.
27. Do not invent schemas or add or drop indexes on your own. Suggest them with evidence (query plan, table size) and let the owner decide. PostgreSQL does not index foreign keys by itself, so mention that.
28. Keep logic in visible Go and SQL. Do not depend on triggers, views, materialized views, stored procedures or row-level security that the application code cannot see.
29. Test with two layers. Unit-test business logic against a repository interface with a mock. Test SQL, transactions, NULL round-trips and constraints against a real database, behind `//go:build integration`. Never test against production.
30. For integration tests, wrap each test in a transaction and roll it back in teardown so each test starts clean. Use testcontainers-go for CI when no database exists. `go-sqlmock` checks query shape and error paths, not that the SQL is valid.

## Patterns

Get one row.

```go
func (r *Repo) GetUser(ctx context.Context, id int64) (*User, error) {
    var u User
    err := r.db.GetContext(ctx, &u,
        "SELECT id, name, email, deleted_at FROM users WHERE id = $1", id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrUserNotFound
        }
        return nil, fmt.Errorf("querying user %d: %w", id, err)
    }
    return &u, nil
}
```

Iterate rows.

```go
rows, err := db.QueryContext(ctx, "SELECT id, name FROM users WHERE active")
if err != nil {
    return fmt.Errorf("querying users: %w", err)
}
defer rows.Close()

for rows.Next() {
    var u User
    if err := rows.Scan(&u.ID, &u.Name); err != nil {
        return fmt.Errorf("scanning user: %w", err)
    }
    users = append(users, u)
}
if err := rows.Err(); err != nil {
    return fmt.Errorf("iterating users: %w", err)
}
```

Transaction with a locking read.

```go
tx, err := db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
if err != nil {
    return fmt.Errorf("begin: %w", err)
}
defer tx.Rollback() // no-op after Commit

var balance int64 // cents
if err := tx.QueryRowContext(ctx,
    "SELECT balance FROM accounts WHERE id = $1 AND owner_id = $2 FOR UPDATE",
    accountID, ownerID).Scan(&balance); err != nil {
    return fmt.Errorf("locking account: %w", err)
}
if balance < amount {
    return ErrInsufficientFunds
}
if _, err := tx.ExecContext(ctx,
    "UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, accountID); err != nil {
    return fmt.Errorf("debiting: %w", err)
}
if err := tx.Commit(); err != nil {
    return fmt.Errorf("commit: %w", err)
}
```

Shared interface for `*sql.DB` and `*sql.Tx`.

```go
type DBTX interface {
    ExecContext(ctx context.Context, q string, args ...any) (sql.Result, error)
    QueryContext(ctx context.Context, q string, args ...any) (*sql.Rows, error)
    QueryRowContext(ctx context.Context, q string, args ...any) *sql.Row
}
```

Setup with ping and pool limits.

```go
db, err := sql.Open("pgx", os.Getenv("DATABASE_URL"))
if err != nil {
    return fmt.Errorf("open: %w", err)
}
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(10)
db.SetConnMaxLifetime(5 * time.Minute)
db.SetConnMaxIdleTime(1 * time.Minute)

pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
if err := db.PingContext(pingCtx); err != nil {
    return fmt.Errorf("ping: %w", err)
}
```

Per-query timeout.

```go
ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
defer cancel()
err := db.QueryRowContext(ctx, "SELECT count(*) FROM orders WHERE user_id = $1", uid).Scan(&n)
```

Batch insert in chunks.

```go
const batch = 500
for i := 0; i < len(users); i += batch {
    end := min(i+batch, len(users))
    if _, err := db.NamedExecContext(ctx,
        "INSERT INTO users (name, email) VALUES (:name, :email)", users[i:end]); err != nil {
        return fmt.Errorf("inserting users %d-%d: %w", i, end, err)
    }
}
```

## Never

- `db.Query` for an INSERT or UPDATE: use `db.ExecContext`, or the connection leaks.
- A loop that ends with no `rows.Err()` check: add it after the loop.
- `defer rows.Close()` before the error check: check `err` first, then defer.
- `db.Query(...)` with no context: use `QueryContext(ctx, ...)`.
- Using `db.ExecContext` while a `tx` is open for the same work: use `tx` for every statement.
- A `Begin` with no `defer tx.Rollback()`: an early return leaves the transaction open and holds a connection.
- Ignoring the error from `tx.Commit()`: the write may not have happened.
- Scanning a nullable column into `string`: use `*string` or `sql.NullString`.
- `err == sql.ErrNoRows`: use `errors.Is`, because the error may be wrapped.
- Read, compute, then write with no lock or atomic `UPDATE`: lock the row with `FOR UPDATE` or make the update atomic.
- A pool with no limits: set max open, max idle, lifetime and idle time.
- `OFFSET 100000`: use cursor pagination.
- Schema changes, `CREATE INDEX` or `DROP INDEX` from application code or by guess: use reviewed migrations and suggest changes with evidence.
- Checking for a record by its ID and then reading it with a second ID-only query: put the ownership filter in the query itself.

## Check before you report

- `go build ./... && go vet ./...` pass, and `golangci-lint run` is clean (`sqlclosecheck`, `rowserrcheck`, `errcheck`, `nilerr`, `noctx`).
- `grep -rnE '\.(Query|QueryRow|Exec|Begin)\(' --include=*.go .` shows no call without a context variant in non-test code.
- `grep -rnE 'Sprintf\("[^"]*(SELECT|INSERT|UPDATE|DELETE)' --include=*.go .` shows only allowlisted identifiers, never user values.
- Every `Query` has `defer rows.Close()` and a `rows.Err()` check; every `Begin` has a deferred `Rollback`.
- `go test -race ./...` passes, and `go test -tags=integration ./...` passes against a real database for any new SQL, transaction or NULL handling.
- The pool is configured where the `*sql.DB` is created, and startup pings the database.
- Any lock, isolation level or retry you added has a test (or a written reason) for concurrent access.
- Schema or index changes appear only as a migration file or a written suggestion, not as code that runs at request time.

---
Compiled from samber/cc-skills-golang (MIT, © 2026 Samuel Berthe): golang-database. https://github.com/samber/cc-skills-golang
