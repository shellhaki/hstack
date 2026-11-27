# Profile cache

`createCache(load, ttlMs)` in `src/cache.ts` caches the results of a slow async `load(key)` (a call to
the profile API) for `ttlMs`. Two problems in production:

1. Every time a popular profile expires, the profile API gets a burst of identical requests.
2. When the profile API has a hiccup, some users keep seeing the error for minutes afterwards.

Fix `createCache`. Keep its signature. Run the tests with `bun test`.
