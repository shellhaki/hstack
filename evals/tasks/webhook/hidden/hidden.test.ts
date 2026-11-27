import { expect, test } from "bun:test";
import { handleEvent, Store } from "../src/webhook";

const pay = (id: string, p: string, cents: number, c = "c1") => ({ id, type: "payment.succeeded", customerId: c, paymentId: p, amountCents: cents });
const refund = (id: string, p: string, cents: number, c = "c1") => ({ id, type: "payment.refunded", customerId: c, paymentId: p, amountCents: cents });

test("the same event delivered twice counts once", async () => {
  const s = new Store();
  await handleEvent(s, pay("e1", "p1", 500));
  await handleEvent(s, pay("e1", "p1", 500));
  expect(await s.getBalance("c1")).toBe(500);
});
test("the same event delivered twice at the same moment counts once", async () => {
  const s = new Store();
  await Promise.all([handleEvent(s, pay("e1", "p1", 500)), handleEvent(s, pay("e1", "p1", 500)), handleEvent(s, pay("e1", "p1", 500))]);
  expect(await s.getBalance("c1")).toBe(500);
});
test("different events for one customer at the same moment are all counted", async () => {
  const s = new Store();
  await Promise.all(Array.from({ length: 10 }, (_, i) => handleEvent(s, pay(`e${i}`, `p${i}`, 100))));
  expect(await s.getBalance("c1")).toBe(1000);
});
test("a refund arriving before its payment ends with the right balance", async () => {
  const s = new Store();
  await handleEvent(s, refund("e2", "p1", 500));
  await handleEvent(s, pay("e1", "p1", 500));
  expect(await s.getBalance("c1")).toBe(0);
});
test("customers don't affect each other", async () => {
  const s = new Store();
  await Promise.all([handleEvent(s, pay("e1", "p1", 300, "c1")), handleEvent(s, pay("e2", "p2", 700, "c2"))]);
  expect(await s.getBalance("c1")).toBe(300);
  expect(await s.getBalance("c2")).toBe(700);
});
test("unknown event types change nothing and do not throw", async () => {
  const s = new Store();
  await handleEvent(s, { id: "e9", type: "customer.updated", customerId: "c1", paymentId: "", amountCents: 999 });
  expect(await s.getBalance("c1")).toBe(0);
});
