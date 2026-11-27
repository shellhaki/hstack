# Routes: which guide to read, and when

This file tells you which guide to read for the situation you are in. It is for whoever does the
work: you on your own (`/hstack`), or the worker in `/hstack-team`. Read a guide **when its row
applies**, not all at once. The guides are in this folder (`think/`,
`engineering/`); this folder is `~/.config/hstack/skills/hstack/` after install.

Every guide ends with a file you must write. Keep these files in `.hstack/work/` in the project:
they are your working memory, and the reviewer reads them to check your work. Don't commit them.

**The reviewer** in these guides is whoever checks your work: you yourself and then the user when you
work alone, or the senior model in `/hstack-team`. A `QUESTION` goes to the user, or to the senior.

## First: the size
In `/hstack-team` the brief says `SIZE: S`, `M` or `L` (no size means M). Working alone, choose it
yourself: S for one component, a restyle or a contained bug; M for a feature over a few files; L for a
new subsystem, a migration, auth, money or data. A one-line fix needs none of this. The size decides how much of the process
below you run. Process is a tool for hard tasks; on easy ones it only costs time.

| Step | S | M | L |
|---|---|---|---|
| understand → `TASK.md` | in your head; no file | short: criteria and RISKY assumptions | full |
| explore → `MAP.md` | only the files you touch; reuse `.hstack/MAP.md` | reuse `.hstack/MAP.md`, add this task's part | full |
| plan → `PLAN.md` | no | short, then **build without waiting** | full; in `/hstack-team` wait for approval, alone carry on unless the user asked to see plans |
| focus → `PROGRESS.md` | the phase stamps and attempts only | full | full |
| verify → `EVIDENCE.md` | steps 1, 2 and 5 | all steps; step 4 for the main criterion only | all steps |

**Turn budget:** the brief's `BUDGET`, or working alone the size's default (default S 15, M 40, L 80 turns). At the budget, stop and send
your report with what is done and what is left, or a `QUESTION`. Don't grind on.

## Always, in this order

| When | Read | You write |
|---|---|---|
| A new task or brief arrives | `think/understand.md` | `.hstack/work/TASK.md` |
| Before planning, and before the first edit in code you haven't read | `think/explore.md` | `.hstack/work/MAP.md` |
| Phase 1, or before any change that touches more than one file | `think/plan.md` | `.hstack/work/PLAN.md` |
| From the first edit until the report | `think/focus.md` | `.hstack/work/PROGRESS.md` |
| Before you say "done", "fixed", "passes" or "works" | `think/verify.md` | `.hstack/work/EVIDENCE.md` |

## When it happens

| Situation | Read |
|---|---|
| You are about to call a library, framework, CLI flag, config key or API you haven't read in this task | `think/sources.md` |
| A test, build or command fails and you don't know why within one look | `engineering/debug.md` |
| The same approach failed twice | `think/focus.md` (attempt rules), then `engineering/debug.md` |
| The task is a rename, move, cleanup or restructure that must not change behavior | `engineering/refactor.md` |
| You are writing a spec, tests, input handling, auth or anything user-facing | `engineering/practice.md` |
| A decision would change scope, data, dependencies or security; two readings of the brief lead to different code; you're stuck after 3 attempts | `think/escalate.md` |

## Rules that apply everywhere
- **Read before you write.** Never edit a file you haven't opened in this task.
- **Facts over memory.** If you can check it (a file, a type, a command's output), check it.
- **One change, one check.** After each change, run the narrowest check that could fail.
- **Say what you didn't verify.** A gap you name is cheap; a gap the reviewer finds is expensive.

## Domains
UI work: also follow `hstack-ui`. Videos: `hstack-motion`. Research before a decision:
`hstack-research`.
