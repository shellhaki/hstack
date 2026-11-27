# Durations in config

Our config file lets people write timeouts like `"1h30m"` or `"45s"`. Add `parseDuration(text)` to
`src/duration.ts`: it returns the duration in milliseconds. Units: `h`, `m`, `s`, `ms`. Run the tests
with `bun test`.
