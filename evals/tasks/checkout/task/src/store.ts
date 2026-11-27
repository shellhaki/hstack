// A small async store, like a database client. Don't change this file.
export type Line = { sku: string; qty: number };
export type Order = { id: string; customerId: string; lines: Line[]; totalCents: number; status: "paid" };
export type CheckoutRequest = { customerId: string; lines: Line[]; discountCode?: string; idempotencyKey: string };

const tick = () => new Promise((r) => setTimeout(r, Math.random() * 3));

export class Payments {
  charges: { customerId: string; amountCents: number }[] = [];
  failNext = false;
  async charge(customerId: string, amountCents: number): Promise<string> {
    await tick();
    if (this.failNext) { this.failNext = false; throw new Error("card declined"); }
    this.charges.push({ customerId, amountCents });
    return "ch_" + this.charges.length;
  }
}

export class Store {
  products = new Map<string, number>();   // sku -> price in cents
  discounts = new Map<string, number>();  // code -> percent off (e.g. 15)
  orders = new Map<string, Order>();
  payments = new Payments();
  private stock = new Map<string, number>();
  async getStock(sku: string) { await tick(); return this.stock.get(sku) ?? 0; }
  async setStock(sku: string, n: number) { await tick(); this.stock.set(sku, n); }
}
