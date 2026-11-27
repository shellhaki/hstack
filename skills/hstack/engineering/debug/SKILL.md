---
name: hstack-debug
description: "Debug: find the cause before you fix. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Debug: find the cause before you fix

The most common small-model mistake when something fails is to change code until the error goes
away. That fixes a symptom and leaves the bug. A strong engineer proves the cause first, then fixes
it once, with a test. Follow these steps in order.

## Steps
1. **Reproduce it.** Find the exact command that shows the failure, and run it. Write the command
   and the decisive output line in `PROGRESS.md`. Can't reproduce it? Say so: don't fix blind.
2. **Make it small.** Run only the failing test, or cut the input down until the failure barely
   still happens. Smaller cases have fewer possible causes.
3. **Read the whole error.** Find the first error, not the last; the later ones often follow from
   it. In a stack trace, find the top frame in this project's code. Read that code.
4. **List the hypotheses.** Write 2 or 3 possible causes. For each, the evidence for it, the evidence
   against it, and a cheap test that would tell them apart.
5. **Test the hypotheses, without fixing yet.** Use the cheapest check that splits them: a print, an
   assert, a probe script, reading a value at the boundary. Change one thing at a time.
6. **State the root cause** in one line: "X happens because Y, shown by Z". If you can't fill in Z,
   you don't have the cause yet: go back to step 4.
7. **Write a test that fails** because of the cause. Run it and watch it fail.
8. **Fix the cause.** Make the smallest change at the layer where the cause is.
9. **Run the new test, then the full suite.** Compare with the baseline in `MAP.md`. Remove your
   prints and probes.

## Ways to narrow it down
- **`git bisect`** when it worked in an earlier commit.
- **Halve it:** disable half the code path or the input, and see which half the failure follows.
- **Compare with a working case:** what differs between the input that works and the one that
  doesn't?
- **Check the boundary:** print exactly what crosses it (the request body, the DB row, the props),
  not what you think crosses it.

## Never
- Catch and ignore the error, add a retry or sleep, widen a type, or loosen a check to hide it.
- Change a test's expected value so it passes, unless the test was wrong; then say so in the report.
- Make several changes at once and keep the one that "worked".

## In your report
`ROOT CAUSE: <one line>. EVIDENCE: <the line or value>. FIX: <file:line>. TEST: <name>`.
