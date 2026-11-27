# Due dates

An invoice is due at the end of the next business day after it is sent, in the customer's own time
zone. Business days are Monday to Friday, except the public holidays passed in. Implement `dueDate` in
`src/due.ts`:

```ts
dueDate(sentAt: Date, timeZone: string, holidays: string[]): string
```

`timeZone` is an IANA name like `"America/New_York"`, `holidays` are local dates like `"2026-12-25"`,
and the result is the local due date as `"YYYY-MM-DD"`. Run the tests with `bun test`.
