---
name: hstack-testing
description: "Tests that catch bugs. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Tests that catch bugs

A test is only worth having if it would fail when the code is wrong. Smaller models write tests that
restate the code ("it returns what it returns"), test only the happy path, mock the very thing under
test, and pass by luck of timing. Follow these rules.

## Before writing a test
1. **Copy the project's test style:** the runner, file names, helpers and fixtures from the TEMPLATE in
   `MAP.md`. Never add a second test framework.
2. **List the cases first,** from `TASK.md`, before any test code:
   - each acceptance criterion, with its exact input and expected output
   - the boundaries: empty, one, many, the maximum, just over the maximum
   - the error cases: invalid input, missing data, no permission, the dependency failing
   - **every value the input can meaningfully take**, each with a test that expects it to **work**. Ask
     what the value is: a share, weight, ratio, rate, price or amount can be a fraction (2.5) or very
     large; a count of things (items, people, retries) can't be a fraction. Text can be empty, emoji,
     or have a space at the cut point. Values that make no sense (1.5 items, a limit of 0) get a test
     that expects a clear error.
   - the tricky values for this domain (see below)
3. **Expected values come from the spec or a hand calculation,** never from running the code and
   pasting what it printed. A value copied from the output proves nothing.

## Tricky values (check the ones that fit)
- Numbers: 0, negative, fractions, rounding (money in integer cents; amounts that don't split evenly),
  very large, NaN.
- Text: empty string, whitespace only, unicode and emoji (`"é"`, `"👍🏽"` is several code points), very long,
  mixed case, leading or trailing spaces.
- Time: midnight, month and year ends, leap days, time zones, daylight-saving changes. Inject the clock;
  never depend on the real time.
- Collections: empty, one item, duplicates, ties when sorting, items with the same key.
- Order and repeats: the same request twice, two requests at once, out-of-order events, retries.
- IDs and access: another user's ID, a deleted record, an ID that doesn't exist.

## Writing them
- **Assert behavior, not implementation:** outputs, stored state, responses, emitted events. Not which
  private function was called.
- **Mock only at the boundary** (network, clock, randomness, external services), never your own module
  under test. Prefer a real in-memory database or a fake over a mock when the project has one.
- **One behavior per test,** named after it: `"rejects a transfer larger than the balance"`.
- **Exact assertions:** the whole value or the precise field, not `toBeTruthy()` or "contains".
- **Deterministic:** no real sleeps, no real time, no shared state between tests, a fixed seed for
  randomness. A test that passes 9 times in 10 is a failing test.

## Prove the test works
For the tests that guard the main criteria, break the code on purpose and watch them fail
(`think/verify/SKILL.md`, step 4). A test you never saw fail is a guess.

## For a bug fix
Write the test that reproduces the bug **first**, run it, and see it fail for the reason in the bug
report. Then fix. The test stays as a regression test.

## Done when
Every case from your list has a test or is written under NOT VERIFIED with a reason, the suite matches
the baseline plus your new tests, and the main tests were seen to fail when broken.
