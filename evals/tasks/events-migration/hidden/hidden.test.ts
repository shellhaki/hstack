import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { down, up } from "../src/migrate";

const T = Date.UTC(2026, 2, 1, 10, 0, 0); // 2026-03-01T10:00:00Z
const rows: [number, string, string | null][] = [
  [1, "a", "2026-03-01T10:00:00Z"],
  [2, "b", "2026-03-01T12:00:00+02:00"],
  [3, "c", String(T)],
  [4, "d", String(T / 1000)],
  [5, "e", "2026-03-01T10:00:00.250Z"],
  [6, "f", null],
  [7, "g", ""],
  [8, "h", "yesterday"],
  [9, "i", "  2026-03-01T10:00:00Z  "],
];
function seeded() {
  const db = new Database(":memory:");
  db.run("CREATE TABLE events (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, occurred_at TEXT)");
  const ins = db.prepare("INSERT INTO events VALUES (?, ?, ?)");
  for (const r of rows) ins.run(...r);
  return db;
}
const ms = (db: Database, id: number) => (db.query("SELECT occurred_at_ms AS v FROM events WHERE id = ?").get(id) as any)?.v;

test("ISO times, with Z or an offset, become UTC milliseconds", () => {
  const db = seeded(); up(db);
  expect(ms(db, 1)).toBe(T);
  expect(ms(db, 2)).toBe(T);
  expect(ms(db, 5)).toBe(T + 250);
  expect(ms(db, 9)).toBe(T);
});
test("epoch milliseconds and epoch seconds are both recognised", () => {
  const db = seeded(); up(db);
  expect(ms(db, 3)).toBe(T);
  expect(ms(db, 4)).toBe(T);
});
test("missing or unreadable values become NULL, and the rows stay", () => {
  const db = seeded(); up(db);
  expect(ms(db, 6)).toBeNull();
  expect(ms(db, 7)).toBeNull();
  expect(ms(db, 8)).toBeNull();
  expect((db.query("SELECT COUNT(*) AS n FROM events").get() as any).n).toBe(rows.length);
});
test("the column is an integer", () => {
  const db = seeded(); up(db);
  expect((db.query("SELECT typeof(occurred_at_ms) AS t FROM events WHERE id = 3").get() as any).t).toBe("integer");
});
test("down gives back every original value exactly, including the unreadable ones", () => {
  const db = seeded(); up(db); down(db);
  for (const [id, , raw] of rows) {
    expect((db.query("SELECT occurred_at AS v FROM events WHERE id = ?").get(id) as any).v).toBe(raw);
  }
  const cols = db.query("PRAGMA table_info(events)").all().map((c: any) => c.name);
  expect(cols).not.toContain("occurred_at_ms");
});
test("up, down, up again gives the same result", () => {
  const db = seeded(); up(db); down(db); up(db);
  expect(ms(db, 2)).toBe(T);
  expect(ms(db, 8)).toBeNull();
});
