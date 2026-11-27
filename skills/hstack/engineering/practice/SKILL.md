---
name: hstack-practice
description: "Engineering practice. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Engineering practice

Small models fail in predictable ways: they fill gaps with guesses, test their own assumptions, and report success too early. This guide closes those gaps.

## Spec: values, not intentions
- Give every output that leaves the code **by example**: input, then exact output.
  - Bad: "copies the post link".
  - Good: `"/posts/abc"` on `https://site.dev` copies `https://site.dev/posts/abc`.
- Make formats explicit: absolute or relative URLs, date format and time zone, units, casing, separators, limits.
- Say **when** a value is computed: at render, at click time, on the server or on the client. Never read browser-only or time-dependent values during render or prerender.
- Write a **state table** for every interactive element: idle, loading, success, error, disabled, empty. For each state give:
  - the trigger
  - what the user **sees**
  - what a screen reader hears
  - how long it lasts, and what comes next

  Success and failure both need **visible** feedback, and failure never reports success.

## User-facing text
- Count, cut and limit text in grapheme clusters (`Intl.Segmenter` in JS, a grapheme library elsewhere),
  so emoji, flags and accents are never split or miscounted.
- When shortening text, don't leave a space before the `…`, and keep the result within the limit
  including the `…`.

## Tests
- Write tests first, from the spec examples. Write one named test per example and per state row, and name each test after the criterion it proves.
- Use fake timers for anything time-based. Never use real sleeps or real time.
- Test the repeat and edge interactions: double clicks, clicking while loading, unmounting mid-state, empty input, maximum length.
- A test must be able to fail. Re-read every assertion and ask what bug it would catch.

## The real environment (mocks hide these)
- Check the types real drivers return (for example, many database drivers return timestamps as `Date`, not strings) and match them in mocks.
- Check the framework's rendering rules in **this** project's version: which routes or pages are static and which are dynamic, and how to opt in or out. Read the project's docs and `AGENTS.md`.
- Know what real requests look like: body-less POSTs, the headers browsers actually send, and cookies over http in dev versus https in prod.
- Give anything shareable an exact permalink format per item type.

## Security basics
- Validate every input at the boundary (type, length, format) and return clear 4xx errors.
- Authorise on the server, never only in the UI. Check ownership for every write.
- Compare secrets and tokens in constant time, store only hashes of tokens, and never log secrets, tokens, codes or personal data.
- Render user content as text, not HTML, unless it has been sanitised.
- Check tokens before acting on anything they reference, and use atomic updates where two requests can race.

## Code
- Use strict types: no `any`, no type-check suppressions, no disabled lint rules.
- Reuse the project's existing helpers and patterns before writing new ones.
- Keep functions small and side effects at the edges (I/O in one layer, logic in pure functions).
- Change only what the task needs. Don't refactor or rename unrelated code.

## Honest reporting
- Run every check you mention, and quote the real result (counts, failures).
- Say what you didn't verify, and why.
- List deviations from the spec or plan with the reason for each.
