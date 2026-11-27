---
name: hstack-focus
description: "Stay on track. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Stay on track

On long tasks, smaller models lose the thread. They forget the goal after a long log, retry the same
failing idea, or drift into unrelated fixes. A strong engineer keeps a short running note and changes
approach early. Do the same, deliberately.

## Keep `.hstack/work/PROGRESS.md`
Update it after every step, and **reread it before every step** and after any long command output.
```
GOAL: <from TASK.md, one line>
TIMES: understand <hh:mm> · explore <hh:mm> · plan <hh:mm> · build <hh:mm> · verify <hh:mm> · report <hh:mm>
STEP: <current step number from PLAN.md> — <what>
DONE: <steps finished, with the check that passed>
NEXT: <the next step>
ATTEMPTS (current problem):
  1. <what I tried> → <result>
SOURCES READ: <file / command> — <fact learned>
NOTICED, NOT DONE: <unrelated issues you saw; report them, don't fix them>
```

Stamp each phase when it starts (`date +%H:%M`). The reviewer uses the stamps to find where time goes.

## Attempt rules
An attempt is one change followed by the check that should prove it.
- **After 2 failed attempts with the same approach:** stop. Write down why you think it fails. Pick a
  different approach, or read `engineering/debug/SKILL.md` if you don't know the cause.
- **After 3 failed attempts on one problem, whatever the approach:** send a `QUESTION`
  (`think/escalate/SKILL.md`) with what you tried and the results.
- Never undo the reviewer's instructions or the brief's constraints to make a check pass.

## Loop signs: stop when you see one
- You are about to run the same command with the same input for the third time.
- You are editing the same lines back and forth.
- You are adding a retry, a sleep, a longer timeout or a broader type to make an error go away.
- Your last three steps didn't move a check from failing to passing.
- You are near the brief's turn `BUDGET` (see `ROUTES.md`).

When you stop: reread `PROGRESS.md` and `TASK.md`, write what you know and what you don't, then choose
a new approach or escalate.

## Scope
- Do only the current step. If you notice something else that is wrong, write it under NOTICED, NOT
  DONE and keep going.
- Don't rename, reformat or "improve" code the task doesn't need.

## Long output
Never read a long log in full. Use `tail -50`, `grep -n "error\|FAIL\|panic"`, or run only the
failing test. Write the one decisive line into `PROGRESS.md`.
