export type Event = { id: string; type: "payment.succeeded" | "payment.refunded" | string; customerId: string; paymentId: string; amountCents: number };

// A tiny async store, like a database client.
export class Store {
  balances = new Map<string, number>();
  processed = new Set<string>();
  async getBalance(customerId: string) { await tick(); return this.balances.get(customerId) ?? 0; }
  async setBalance(customerId: string, cents: number) { await tick(); this.balances.set(customerId, cents); }
}
const tick = () => new Promise((r) => setTimeout(r, Math.random() * 3));

export async function handleEvent(store: Store, event: Event): Promise<void> {
  const balance = await store.getBalance(event.customerId);
  if (event.type === "payment.succeeded") await store.setBalance(event.customerId, balance + event.amountCents);
  if (event.type === "payment.refunded") await store.setBalance(event.customerId, balance - event.amountCents);
}
