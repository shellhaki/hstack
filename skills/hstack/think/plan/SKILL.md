---
name: hstack-plan
description: "Plan the work. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Plan the work

A plan is a list of small steps, each of which can be checked. A strong engineer orders the steps so
that the thing most likely to be wrong is found out first, not last.

Read `TASK.md` and `MAP.md` before you start; the plan is built from them.

## Steps
1. **Map each criterion to tests.** For every criterion in `TASK.md`, name the test or tests that
   will prove it, with the exact example as the assertion. A criterion with no test isn't planned.
2. **Cut the work into steps.** Each step:
   - changes one thing (a function, an endpoint, a component, a migration)
   - names the files it touches
   - names the check that proves it: a test, a command, or a request with its expected result
   - is small enough that a failing check points to the problem (as a guide, under about 100
     changed lines)
3. **Order the steps:**
   1. **The riskiest unknown first.** If the plan depends on something you haven't proven (a library
      behaves a certain way, an API returns a certain shape, a migration works on the real
      database), make the first step a small probe that proves it.
   2. Then the core path: the main criterion, end to end, as thin as possible.
   3. Then the edge cases, errors and states from `TASK.md` IMPLIED.
   4. Then cleanup and docs.
4. **Plan for the risks the brief names:** for each one, the exact measure (a test, a check, a
   guard) and where it lives.
5. **Write how to undo it:** for migrations, data changes and config, the rollback.

## When the plan is wrong
Plans break. When a step shows that an assumption in `TASK.md` or `MAP.md` was false:
1. Stop. Don't patch around it.
2. Update `PLAN.md` (what changed, and the new steps).
3. If it changes a criterion, the scope, the data model or a dependency, it's a `QUESTION`
   (`think/escalate/SKILL.md`). Otherwise continue and mention it in your report.

## Write `.hstack/work/PLAN.md`
```
CRITERIA → TESTS:
  1 → test "<name>" asserts <example>
STEPS:
  1. [probe] <what> — files: ... — check: <command / expected>
  2. <what> — files: ... — check: ...
RISKS: <risk> → <measure, where>
ROLLBACK: <how to undo, or n/a>
DONE COMMANDS: <from the brief + MAP.md>
```
In `/hstack-team`, your plan report to the senior is the short form of this file, at most 20 lines.
