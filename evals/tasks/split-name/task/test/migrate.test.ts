import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { up } from "../src/migrate";

test("adds the columns", () => {
  const db = new Database(":memory:");
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT)");
  up(db);
  const cols = db.query("PRAGMA table_info(users)").all().map((c: any) => c.name);
  expect(cols).toContain("first_name");
});
