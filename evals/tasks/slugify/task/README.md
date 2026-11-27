# URL slugs

Blog posts need a URL slug made from their title. Add `slugify(title)` to `src/slug.ts`: it returns a
lowercase slug of letters, digits and single hyphens, at most 60 characters, suitable for a URL path.
Run the tests with `bun test`.
