# Feed pagination bug

Users scrolling the activity feed report that some items show up twice and others never show up.
`listFeed` in `src/feed.ts` returns a page of items, newest first, and a cursor for the next page.
Fix it. Keep the function signature. Run the tests with `bun test`.
