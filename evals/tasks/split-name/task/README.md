# Split the name column

The `users` table (SQLite, `bun:sqlite`) has a single `name` column. Product wants `first_name` and
`last_name` instead. Write the migration in `src/migrate.ts`: `up(db)` and `down(db)`. Existing users
must keep their data. Run the tests with `bun test`.
