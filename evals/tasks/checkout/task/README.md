# Checkout

Implement `checkout(store, req)` in `src/checkout.ts`. It turns a cart into a paid order:

- Prices come from `store.products` (cents). A cart line is `{ sku, qty }`.
- An optional `discountCode` gives a percentage off the whole cart (`store.discounts`); round the
  discount to the nearest cent. Unknown codes are rejected.
- Stock is in `store` (`getStock` / `setStock`). An order may only be placed if every line is in stock,
  and stock goes down when it is.
- Payment: `store.payments.charge(customerId, amountCents)`. It can fail.
- Mobile clients retry on network errors and send the same `idempotencyKey` each time.

It returns the created `Order`. Throw an `Error` when the order can't be placed. Run the tests with
`bun test`.
