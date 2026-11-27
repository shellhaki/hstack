---
name: hstack-refactor
description: "Refactor without changing behavior. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Refactor without changing behavior

A refactor is only safe when you can prove that behavior didn't change. Smaller models tend to mix
"cleanup" with behavior changes, miss uses of a renamed thing, and trust the typecheck. Follow these
steps.

## Steps
1. **Baseline:** run the full test suite and record the counts and the already-failing tests (see
   `think/explore/SKILL.md`).
2. **Cover what you touch.** If the code you will move or rename has no tests, first write
   characterization tests: they assert what it does **now**, even if that looks odd. Commit nothing;
   just have them green.
3. **Small mechanical steps.** One kind of change per step: rename, move, extract or inline. Run the
   tests of every touched package after each step. A new failure means: undo that step and look
   closer.
4. **Find every use before renaming,** not only the code: strings, config, routes, SQL, docs, tests,
   snapshots, environment variables, translations.
   `grep -rn "<old name>" .` (also try other casings: `old_name`, `oldName`, `OldName`, `old-name`).
   A typecheck misses all of these.
5. **Never mix in behavior changes.** If you find a bug while refactoring, write it under NOTICED,
   NOT DONE in `PROGRESS.md`. Fix it only if the brief asks, as a separate step with its own test.
6. **Last, review the full diff** for anything that isn't purely structural: a changed default, a
   reordered side effect, a changed error message.

## Done when
The suite matches the baseline (no new failures), the old name has zero remaining uses (show the
grep), and the diff has no behavior change. If it has one, list it.
