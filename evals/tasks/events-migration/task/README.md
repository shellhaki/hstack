# Event timestamps

The `events` table (SQLite, `bun:sqlite`) stores `occurred_at` as TEXT. The data came from three
different clients over the years. We want a new INTEGER column `occurred_at_ms`: the time in
milliseconds since the epoch, UTC, so we can sort and index it.

Write the migration in `src/migrate.ts`: `up(db)` and `down(db)`. Don't lose anything. Run the tests
with `bun test`.
