import { expect, test } from "bun:test";
import { checkout } from "../src/checkout";
import { Store } from "../src/store";

test("places a simple order", async () => {
  const s = new Store();
  s.products.set("tea", 500);
  await s.setStock("tea", 3);
  const o = await checkout(s, { customerId: "c1", lines: [{ sku: "tea", qty: 2 }], idempotencyKey: "k1" });
  expect(o.totalCents).toBe(1000);
});
