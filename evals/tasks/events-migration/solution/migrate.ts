import type { Database } from "bun:sqlite";
function parse(raw: string | null): number | null {
  if (raw === null) return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) { const n = Number(s); return s.length <= 10 ? n * 1000 : n; }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(s)) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}
export function up(db: Database): void {
  db.transaction(() => {
    db.run("ALTER TABLE events ADD COLUMN occurred_at_ms INTEGER");
    const upd = db.prepare("UPDATE events SET occurred_at_ms = ? WHERE id = ?");
    for (const r of db.query("SELECT id, occurred_at FROM events").all() as any[]) upd.run(parse(r.occurred_at), r.id);
    db.run("CREATE INDEX IF NOT EXISTS events_occurred_at_ms ON events (occurred_at_ms)");
  })();
}
export function down(db: Database): void {
  db.transaction(() => {
    db.run("DROP INDEX IF EXISTS events_occurred_at_ms");
    db.run("ALTER TABLE events DROP COLUMN occurred_at_ms");
  })();
}
