import { beforeEach, expect, test } from "bun:test";
import { db, getInvoice } from "../src/invoices";

beforeEach(() => {
  db.clear();
  db.set("inv1", { id: "inv1", ownerId: "u1", totalCents: 5000, note: "", dueDate: "2026-12-01", paid: false });
});

test("owner can read", () => {
  expect(getInvoice({ id: "u1" }, "inv1").totalCents).toBe(5000);
});
