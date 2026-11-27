import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { up } from "../src/migrate";

test("adds the column", () => {
  const db = new Database(":memory:");
  db.run("CREATE TABLE events (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, occurred_at TEXT)");
  db.run("INSERT INTO events VALUES (1, 'signup', '2026-03-01T10:00:00Z')");
  up(db);
  expect((db.query("SELECT occurred_at_ms FROM events WHERE id = 1").get() as any).occurred_at_ms).toBe(Date.UTC(2026, 2, 1, 10));
});
