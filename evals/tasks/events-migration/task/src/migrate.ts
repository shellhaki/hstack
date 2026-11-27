import type { Database } from "bun:sqlite";

// Current schema: CREATE TABLE events (id INTEGER PRIMARY KEY, kind TEXT NOT NULL, occurred_at TEXT)

export function up(db: Database): void {
  throw new Error("not implemented");
}

export function down(db: Database): void {
  throw new Error("not implemented");
}
