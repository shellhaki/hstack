import { expect, test } from "bun:test";
import { handleEvent, Store } from "../src/webhook";

test("a payment adds to the balance", async () => {
  const s = new Store();
  await handleEvent(s, { id: "e1", type: "payment.succeeded", customerId: "c1", paymentId: "p1", amountCents: 500 });
  expect(s.balances.get("c1")).toBe(500);
});
