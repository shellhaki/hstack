import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { down, up } from "../src/migrate";

function seeded() {
  const db = new Database(":memory:");
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT)");
  const ins = db.prepare("INSERT INTO users (id, email, name) VALUES (?, ?, ?)");
  ins.run(1, "a@x.io", "Ada Lovelace");
  ins.run(2, "b@x.io", "Cher");
  ins.run(3, "c@x.io", "Mary Ann Evans");
  ins.run(4, "d@x.io", null);
  ins.run(5, "e@x.io", "  Grace   Hopper ");
  return db;
}
const row = (db: Database, id: number) => db.query("SELECT * FROM users WHERE id = ?").get(id) as any;
const cols = (db: Database) => db.query("PRAGMA table_info(users)").all().map((c: any) => c.name);

test("existing names are split", () => {
  const db = seeded(); up(db);
  expect(row(db, 1)).toMatchObject({ first_name: "Ada", last_name: "Lovelace" });
  const r3 = row(db, 3);
  expect([r3.first_name, r3.last_name].join(" ")).toBe("Mary Ann Evans");
  expect(r3.first_name.length).toBeGreaterThan(0);
  expect(r3.last_name.length).toBeGreaterThan(0);
  expect(row(db, 5)).toMatchObject({ first_name: "Grace", last_name: "Hopper" });
});
test("one-word and missing names keep working", () => {
  const db = seeded(); up(db);
  expect(row(db, 2).first_name).toBe("Cher");
  expect(row(db, 2).last_name ?? "").toBe("");
  expect(row(db, 4).first_name ?? null).toBeNull();
});
test("other data untouched and constraints kept", () => {
  const db = seeded(); up(db);
  expect(row(db, 1).email).toBe("a@x.io");
  expect(() => db.run("INSERT INTO users (id, email) VALUES (9, 'a@x.io')")).toThrow();
  expect(() => db.run("INSERT INTO users (id) VALUES (10)")).toThrow();
});
test("name column is gone after up", () => {
  const db = seeded(); up(db);
  expect(cols(db)).not.toContain("name");
});
test("down restores the original names", () => {
  const db = seeded(); up(db); down(db);
  expect(cols(db)).toContain("name");
  expect(cols(db)).not.toContain("first_name");
  expect(row(db, 1).name).toBe("Ada Lovelace");
  expect(row(db, 3).name).toBe("Mary Ann Evans");
  expect(row(db, 2).name).toBe("Cher");
  expect(row(db, 4).name).toBeNull();
});
test("up, down, up again works", () => {
  const db = seeded(); up(db); down(db); up(db);
  expect(row(db, 1)).toMatchObject({ first_name: "Ada", last_name: "Lovelace" });
});
test("a failure leaves the table as it was", () => {
  const db = seeded();
  db.run("CREATE TABLE users_new (x INTEGER)");
  try { up(db); } catch {}
  const c = cols(db);
  expect(c.includes("name") || (c.includes("first_name") && row(db, 1).first_name === "Ada")).toBe(true);
  expect(row(db, 1).email).toBe("a@x.io");
});
