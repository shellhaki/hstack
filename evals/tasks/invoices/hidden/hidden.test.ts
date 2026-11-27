import { beforeEach, expect, test } from "bun:test";
import { db, getInvoice, HttpError, updateInvoice } from "../src/invoices";

beforeEach(() => {
  db.clear();
  db.set("inv1", { id: "inv1", ownerId: "u1", totalCents: 5000, note: "", dueDate: "2026-12-01", paid: false });
});
const status = (fn: () => unknown) => { try { fn(); return 200; } catch (e) { return e instanceof HttpError ? e.status : 500; } };

test("owner can update note and due date", () => {
  const inv = updateInvoice({ id: "u1" }, "inv1", { note: "thanks", dueDate: "2026-12-15" });
  expect(inv.note).toBe("thanks");
  expect(getInvoice({ id: "u1" }, "inv1").dueDate).toBe("2026-12-15");
});
test("signed out gets 401", () => {
  expect(status(() => updateInvoice(null, "inv1", { note: "x" }))).toBe(401);
});
test("another user cannot update it, and it is unchanged", () => {
  expect(status(() => updateInvoice({ id: "u2" }, "inv1", { note: "hacked" }))).toBe(404);
  expect(db.get("inv1")!.note).toBe("");
});
test("cannot change other fields through the body", () => {
  const s = status(() => updateInvoice({ id: "u1" }, "inv1", { note: "ok", ownerId: "u2", totalCents: 1, paid: true } as any));
  const inv = db.get("inv1")!;
  expect(inv.ownerId).toBe("u1");
  expect(inv.totalCents).toBe(5000);
  expect(inv.paid).toBe(false);
  expect([200, 400]).toContain(s);
});
test("invalid values are rejected with 400 and nothing is stored", () => {
  expect(status(() => updateInvoice({ id: "u1" }, "inv1", { dueDate: "not a date" }))).toBe(400);
  expect(status(() => updateInvoice({ id: "u1" }, "inv1", { note: 42 } as any))).toBe(400);
  expect(status(() => updateInvoice({ id: "u1" }, "inv1", { note: "x".repeat(10001) }))).toBe(400);
  expect(db.get("inv1")!.dueDate).toBe("2026-12-01");
});
test("missing invoice is 404", () => {
  expect(status(() => updateInvoice({ id: "u1" }, "nope", { note: "x" }))).toBe(404);
});
test("returns a copy, not the stored object", () => {
  const inv = updateInvoice({ id: "u1" }, "inv1", { note: "a" });
  inv.totalCents = 1;
  expect(db.get("inv1")!.totalCents).toBe(5000);
});
