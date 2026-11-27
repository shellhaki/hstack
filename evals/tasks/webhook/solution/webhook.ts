export type Event = { id: string; type: "payment.succeeded" | "payment.refunded" | string; customerId: string; paymentId: string; amountCents: number };
export class Store {
  balances = new Map<string, number>();
  processed = new Set<string>();
  async getBalance(customerId: string) { await tick(); return this.balances.get(customerId) ?? 0; }
  async setBalance(customerId: string, cents: number) { await tick(); this.balances.set(customerId, cents); }
}
const tick = () => new Promise((r) => setTimeout(r, Math.random() * 3));
const locks = new WeakMap<Store, Map<string, Promise<void>>>();
async function withLock(store: Store, key: string, fn: () => Promise<void>) {
  const m = locks.get(store) ?? new Map<string, Promise<void>>();
  locks.set(store, m);
  const prev = m.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  m.set(key, run.catch(() => {}));
  return run;
}
export async function handleEvent(store: Store, event: Event): Promise<void> {
  if (event.type !== "payment.succeeded" && event.type !== "payment.refunded") return;
  await withLock(store, event.customerId, async () => {
    if (store.processed.has(event.id)) return;
    store.processed.add(event.id);
    const balance = await store.getBalance(event.customerId);
    const delta = event.type === "payment.succeeded" ? event.amountCents : -event.amountCents;
    await store.setBalance(event.customerId, balance + delta);
  });
}
