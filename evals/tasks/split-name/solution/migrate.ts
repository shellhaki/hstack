import type { Database } from "bun:sqlite";
export function up(db: Database): void {
  db.transaction(() => {
    db.run("CREATE TABLE users_mig (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, first_name TEXT, last_name TEXT)");
    for (const r of db.query("SELECT id, email, name FROM users").all() as any[]) {
      let first: string | null = null, last: string | null = null;
      if (r.name !== null) {
        const parts = String(r.name).trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) { first = parts[0]; last = ""; }
        else if (parts.length > 1) { last = parts.pop()!; first = parts.join(" "); }
      }
      db.run("INSERT INTO users_mig (id, email, first_name, last_name) VALUES (?, ?, ?, ?)", [r.id, r.email, first, last]);
    }
    db.run("DROP TABLE users");
    db.run("ALTER TABLE users_mig RENAME TO users");
  })();
}
export function down(db: Database): void {
  db.transaction(() => {
    db.run("CREATE TABLE users_mig (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT)");
    for (const r of db.query("SELECT id, email, first_name, last_name FROM users").all() as any[]) {
      const name = r.first_name === null && !r.last_name ? null : [r.first_name, r.last_name].filter((x) => x).join(" ");
      db.run("INSERT INTO users_mig (id, email, name) VALUES (?, ?, ?)", [r.id, r.email, name]);
    }
    db.run("DROP TABLE users");
    db.run("ALTER TABLE users_mig RENAME TO users");
  })();
}
