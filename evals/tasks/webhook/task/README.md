# Payment webhooks

The payment provider calls us with events (`payment.succeeded`, `payment.refunded`), and `handleEvent`
in `src/webhook.ts` updates the customer's balance. Support has found customers with wrong balances.
The provider's docs say: events can be delivered more than once and are not guaranteed to arrive in
order; each event has a unique `id`. Fix `handleEvent`. Run the tests with `bun test`.
