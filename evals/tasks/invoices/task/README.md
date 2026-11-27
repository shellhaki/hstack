# Edit invoices

Add `updateInvoice` to `src/invoices.ts` so users can edit the `note` and `dueDate` of their invoices.
It takes the signed-in user, the invoice id and the fields to change (as received from the request
body), and returns the updated invoice. Follow the style of `getInvoice`. Run the tests with `bun test`.
