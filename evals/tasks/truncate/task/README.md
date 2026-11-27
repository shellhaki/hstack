# Post previews

Post previews must fit in a small card. Add `truncate(text, max)` to `src/truncate.ts`: it returns the
text unchanged if it fits in `max` characters, otherwise a shortened version that ends with `…` and is
at most `max` characters long. Run the tests with `bun test`.
