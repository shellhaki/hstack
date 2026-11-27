import { expect, test } from "bun:test";
import { checkout } from "../src/checkout";
import { Store } from "../src/store";

async function shop() {
  const s = new Store();
  s.products.set("tea", 333); s.products.set("mug", 666);
  s.discounts.set("SAVE15", 15);
  await s.setStock("tea", 5); await s.setStock("mug", 1);
  return s;
}
const req = (lines: any[], key: string, extra: any = {}) => ({ customerId: "c1", lines, idempotencyKey: key, ...extra });

test("total with a percentage discount, rounded to the nearest cent", async () => {
  const s = await shop();
  const o = await checkout(s, req([{ sku: "tea", qty: 3 }], "k1", { discountCode: "SAVE15" }));
  // 999 - round(149.85) = 999 - 150
  expect(o.totalCents).toBe(849);
  expect(s.payments.charges).toEqual([{ customerId: "c1", amountCents: 849 }]);
});
test("stock goes down on success", async () => {
  const s = await shop();
  await checkout(s, req([{ sku: "tea", qty: 2 }, { sku: "mug", qty: 1 }], "k1"));
  expect(await s.getStock("tea")).toBe(3);
  expect(await s.getStock("mug")).toBe(0);
});
test("out of stock: no charge, no stock change, no order", async () => {
  const s = await shop();
  await expect(checkout(s, req([{ sku: "tea", qty: 1 }, { sku: "mug", qty: 2 }], "k1"))).rejects.toThrow();
  expect(s.payments.charges.length).toBe(0);
  expect(await s.getStock("tea")).toBe(5);
  expect(s.orders.size).toBe(0);
});
test("payment fails: stock is given back and no order exists", async () => {
  const s = await shop();
  s.payments.failNext = true;
  await expect(checkout(s, req([{ sku: "tea", qty: 2 }], "k1"))).rejects.toThrow();
  expect(await s.getStock("tea")).toBe(5);
  expect(s.orders.size).toBe(0);
});
test("a retry with the same key returns the same order and charges once", async () => {
  const s = await shop();
  const a = await checkout(s, req([{ sku: "tea", qty: 1 }], "k1"));
  const b = await checkout(s, req([{ sku: "tea", qty: 1 }], "k1"));
  expect(b.id).toBe(a.id);
  expect(s.payments.charges.length).toBe(1);
  expect(await s.getStock("tea")).toBe(4);
});
test("the same key sent twice at once charges once", async () => {
  const s = await shop();
  const [a, b] = await Promise.all([checkout(s, req([{ sku: "tea", qty: 1 }], "k1")), checkout(s, req([{ sku: "tea", qty: 1 }], "k1"))]);
  expect(a.id).toBe(b.id);
  expect(s.payments.charges.length).toBe(1);
  expect(await s.getStock("tea")).toBe(4);
});
test("two customers racing for the last item: exactly one wins", async () => {
  const s = await shop();
  const results = await Promise.allSettled([
    checkout(s, { customerId: "a", lines: [{ sku: "mug", qty: 1 }], idempotencyKey: "ka" }),
    checkout(s, { customerId: "b", lines: [{ sku: "mug", qty: 1 }], idempotencyKey: "kb" }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled").length).toBe(1);
  expect(s.payments.charges.length).toBe(1);
  expect(await s.getStock("mug")).toBe(0);
});
test("a retry after a failed payment can succeed", async () => {
  const s = await shop();
  s.payments.failNext = true;
  await expect(checkout(s, req([{ sku: "tea", qty: 1 }], "k1"))).rejects.toThrow();
  const o = await checkout(s, req([{ sku: "tea", qty: 1 }], "k1"));
  expect(o.status).toBe("paid");
  expect(s.payments.charges.length).toBe(1);
});
test("rejects bad carts without charging", async () => {
  const s = await shop();
  for (const lines of [[], [{ sku: "nope", qty: 1 }], [{ sku: "tea", qty: 0 }], [{ sku: "tea", qty: -1 }], [{ sku: "tea", qty: 1.5 }]]) {
    await expect(checkout(s, req(lines, "k" + Math.random()))).rejects.toThrow();
  }
  await expect(checkout(s, req([{ sku: "tea", qty: 1 }], "kx", { discountCode: "FAKE" }))).rejects.toThrow();
  expect(s.payments.charges.length).toBe(0);
  expect(await s.getStock("tea")).toBe(5);
});
