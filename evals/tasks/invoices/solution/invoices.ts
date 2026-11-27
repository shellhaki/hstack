export type User = { id: string };
export type Invoice = { id: string; ownerId: string; totalCents: number; note: string; dueDate: string; paid: boolean };
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const db = new Map<string, Invoice>();
export function getInvoice(user: User | null, id: string): Invoice {
  if (!user) throw new HttpError(401, "sign in first");
  const inv = db.get(id);
  if (!inv || inv.ownerId !== user.id) throw new HttpError(404, "invoice not found");
  return { ...inv };
}
export function updateInvoice(user: User | null, id: string, body: Record<string, unknown>): Invoice {
  if (!user) throw new HttpError(401, "sign in first");
  const inv = db.get(id);
  if (!inv || inv.ownerId !== user.id) throw new HttpError(404, "invoice not found");
  const patch: Partial<Invoice> = {};
  if ("note" in body) {
    if (typeof body.note !== "string" || body.note.length > 10000) throw new HttpError(400, "note must be text up to 10000 characters");
    patch.note = body.note;
  }
  if ("dueDate" in body) {
    const d = body.dueDate;
    if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d) || isNaN(Date.parse(d))) throw new HttpError(400, "dueDate must be YYYY-MM-DD");
    patch.dueDate = d;
  }
  const next = { ...inv, ...patch };
  db.set(id, next);
  return { ...next };
}
