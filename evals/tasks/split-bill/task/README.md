# Split a bill

Friends split a restaurant bill by shares (e.g. Ana had 2 drinks, Ben 1). Implement `splitBill` in
`src/split.ts`:

```ts
splitBill(totalCents: number, shares: number[]): number[]
```

It returns how many cents each person pays, in the same order as `shares`, proportional to their share.
Run the tests with `bun test`.
