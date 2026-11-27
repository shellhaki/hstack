# Verify before you say done

"Done" is a claim, and every claim needs evidence. Smaller models report success too early: a check
they didn't run, a test that can't fail, a criterion they forgot. A strong engineer tries to prove
themselves wrong before anyone else does. This guide is that habit as steps.

**By size** (the brief's `SIZE`): S runs steps 1, 2 and 5. M runs all steps, with step 4 only for
the main criterion. L runs everything.

## Steps
1. **Run every done command** from the brief and `MAP.md`. Record the real counts: passed, failed,
   skipped. Compare with the baseline in `MAP.md`: any new failure is yours.
2. **Go through `TASK.md` line by line.** For each criterion and each IMPLIED item, write the
   evidence: the test that asserts it, or the command or request you ran and its output. No
   evidence means not done. Say so.
3. **Run the real thing once**, outside the tests, where you can:
   - an endpoint: `curl` it, including one error case
   - a CLI: run it
   - a UI: load the page and capture it
   - a migration: run it up and down on a scratch database

   Mocks hide real behavior: types, headers, time zones, permissions.
4. **Prove your key tests can fail.** For the one or two tests that guard the main criterion:
   1. Break the code on purpose (flip a condition, return early).
   2. Run the test and confirm it fails.
   3. Restore the code and confirm it passes.

   A test that passes either way proves nothing.
5. **Review your diff as a hostile senior.** Read every changed line and check:
   - Is debug output, commented-out code or a TODO left in?
   - Is anything unused (code, imports, files)?
   - Are there type escapes (`any`, `ignore`, `nolint`) or disabled lint rules?
   - Errors: is every failure path handled, and is the message clear?
   - Is a secret, token or piece of personal data logged?
   - Edge cases: empty, null, maximum size, unicode, two requests at once.
   - Callers: did every caller in `MAP.md` CALLERS AT RISK keep working?
   - Names and layout: do they match the TEMPLATE from `MAP.md`?
   - Is there a change the task didn't need?

   Fix what you find, then go back to step 1.
6. **Write the gaps.** Anything you couldn't verify, and why.

## Write `.hstack/work/EVIDENCE.md`
```
CHECKS: <command> → <real counts>   (baseline: <counts>)
CRITERIA:
  1. <criterion> — <test name or command> → <result>
IMPLIED: <item> — <evidence or n/a>
REAL RUN: <what you ran> → <what happened>
FAILS-WHEN-BROKEN: <test> failed with <change>, passed after restore
NOT VERIFIED: <item> — <why>
```

## Words you may not use without evidence next to them
"should work", "probably", "I believe this fixes", "all tests pass" (without a count), "verified"
(without saying how).
