import type { Database } from "bun:sqlite";

// Current schema: CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT)

export function up(db: Database): void {
  throw new Error("not implemented");
}

export function down(db: Database): void {
  throw new Error("not implemented");
}
