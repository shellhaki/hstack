import type { CheckoutRequest, Order, Store } from "./store";

export async function checkout(store: Store, req: CheckoutRequest): Promise<Order> {
  throw new Error("not implemented");
}
