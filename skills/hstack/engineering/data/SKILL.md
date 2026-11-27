---
name: hstack-data
description: "Changing data and schemas safely. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Changing data and schemas safely

Code can be rolled back; data can't. Smaller models write migrations that work on an empty test
database and fail or lose data on a real one. Read this before any migration, schema change, backfill,
or code that writes many rows.

## Before you change a schema
1. **Use the project's migration tool and its naming** (the TEMPLATE in `MAP.md`). Never edit a
   migration that has already run anywhere; add a new one.
2. **Assume the table is full and in use.** Existing rows, live traffic, old code still running while
   the new code deploys.
3. **Write the down migration** (or say in the report why it can't exist), and run up, down and up
   again on a scratch database.

## Patterns that break on real data
| Change | What goes wrong | Do instead |
|---|---|---|
| Add a NOT NULL column | fails on existing rows | add it nullable or with a default, backfill, then add NOT NULL |
| Rename a column or table | old code still running breaks | add the new one, write both, backfill, switch reads, drop the old later |
| Drop a column | old code still reads it; data gone for good | stop using it in code first, drop in a later release |
| Change a type | values that don't convert; long locks | new column, backfill with explicit conversion, switch |
| Add a unique constraint | existing duplicates make it fail | find and resolve duplicates first, in the migration or before it |
| Add an index on a big table | locks writes | use the database's non-blocking option (`CONCURRENTLY` in Postgres) |
| Backfill in one statement | long lock, huge transaction | batches with a cursor on the primary key |

## Writing data in code
- **Transactions** around writes that must happen together. Know what happens if the process dies
  halfway.
- **Idempotent:** running the same operation twice (a retry, a duplicate event) must not double the
  effect. Use a unique key, an upsert, or a processed-events table.
- **Concurrency:** read-then-write races ("check the balance, then subtract") need a row lock, an atomic
  update (`UPDATE … SET x = x - 1 WHERE x >= 1`) or a version check.
- **Money** in integer minor units (cents), never floats. When splitting, the parts must add up to the
  total exactly.
- **Time** stored in UTC with the time zone made explicit at the edges.
- **Deletes:** check what references the row (foreign keys, cascades) and whether the project
  soft-deletes.
- **Queries:** parameters, never string concatenation. Every query that can return many rows has a
  limit or pagination.

## Test with data
- A migration test starts from a database **with rows in the old shape**, including awkward ones (nulls,
  duplicates, the longest value), runs the migration, and checks the rows after.
- A concurrency fix needs a test that runs the two operations together.

## In your report
Say what happens to existing rows, how to roll back, and any step that must run in a certain order with
the deploy.
