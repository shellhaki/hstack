import type { CheckoutRequest, Order, Store } from "./store";
const locks = new WeakMap<Store, Promise<unknown>>();
const inflight = new WeakMap<Store, Map<string, Promise<Order>>>();
function serial<T>(store: Store, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(store) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  locks.set(store, run.catch(() => {}));
  return run;
}
export async function checkout(store: Store, req: CheckoutRequest): Promise<Order> {
  const done = store.orders.get(req.idempotencyKey);
  if (done) return done;
  const m = inflight.get(store) ?? new Map<string, Promise<Order>>();
  inflight.set(store, m);
  const running = m.get(req.idempotencyKey);
  if (running) return running;
  const p = place(store, req).finally(() => m.delete(req.idempotencyKey));
  m.set(req.idempotencyKey, p);
  return p;
}
async function place(store: Store, req: CheckoutRequest): Promise<Order> {
  if (!req.lines.length) throw new Error("cart is empty");
  let subtotal = 0;
  for (const l of req.lines) {
    if (!Number.isInteger(l.qty) || l.qty < 1) throw new Error(`bad quantity for ${l.sku}`);
    const price = store.products.get(l.sku);
    if (price === undefined) throw new Error(`unknown product ${l.sku}`);
    subtotal += price * l.qty;
  }
  let total = subtotal;
  if (req.discountCode !== undefined) {
    const pct = store.discounts.get(req.discountCode);
    if (pct === undefined) throw new Error("unknown discount code");
    total = subtotal - Math.round((subtotal * pct) / 100);
  }
  await serial(store, async () => {
    for (const l of req.lines) if ((await store.getStock(l.sku)) < l.qty) throw new Error(`${l.sku} is out of stock`);
    for (const l of req.lines) await store.setStock(l.sku, (await store.getStock(l.sku)) - l.qty);
  });
  try {
    await store.payments.charge(req.customerId, total);
  } catch (e) {
    await serial(store, async () => { for (const l of req.lines) await store.setStock(l.sku, (await store.getStock(l.sku)) + l.qty); });
    throw e;
  }
  const order: Order = { id: "ord_" + req.idempotencyKey, customerId: req.customerId, lines: req.lines, totalCents: total, status: "paid" };
  store.orders.set(req.idempotencyKey, order);
  return order;
}
