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

// TODO: updateInvoice(user, id, body)
