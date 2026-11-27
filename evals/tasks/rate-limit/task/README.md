# Rate limit

Add a rate limiter so each user can make at most 5 requests in any 10-second window. Implement the
`RateLimiter` class in `src/limit.ts`:

```ts
new RateLimiter(limit: number, windowMs: number, now?: () => number)
limiter.allow(key: string): boolean   // true if this request may go ahead
```

Run the tests with `bun test`.
