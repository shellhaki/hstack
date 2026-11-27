# Routes: which guide to read, and when

## Non-negotiable
1. **A route that applies is not optional.** When a row below matches your situation, open that
   guide **before** you act, and log it (below). "I already know this" is not an exception: the guides
   exist because that feeling is wrong.
2. **Log every route** in `.hstack/work/PROGRESS.md` (S: in your report) the moment it fires:
   `ROUTE <hh:mm> <situation> → <guide> (read)`.
3. **Before you report, run the route check** (`think/verify/SKILL.md`, step 6): every row that
   matched has a ROUTE line. A matched row without one means go back and do it now.
4. **Never report "done" without `EVIDENCE.md`** (S: the evidence lines in the report).
5. **Never write outside the project.** No `/tmp`, no home folder: scratch files, backups and probes go
   in `.hstack/work/tmp/` and are deleted before you report.
6. **Size S follows the S card in `SKILL.md`** to the end, including its trap check.
7. **Support every input that makes sense.** Don't reject a value the brief allows and the domain
   allows (a fractional share, emoji in a name) because it's harder to handle. If you're unsure whether
   it makes sense, ask before writing code; a restriction you add and mention in the report is still a
   bug.
8. **The trap table in `SKILL.md` (section 3) applies at every size.** Check it before you report.

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
| understand → `TASK.md` | **S card (`SKILL.md`)** | short: criteria and RISKY assumptions | full |
| explore → `MAP.md` | **S card** | reuse `.hstack/MAP.md`, add this task's part | full |
| plan → `PLAN.md` | no | short, then **build without waiting** | full; in `/hstack-team` wait for approval, alone carry on unless the user asked to see plans |
| focus → `PROGRESS.md` | no | full | full |
| verify → `EVIDENCE.md` | **S card** | all steps; step 4 for the main criterion only | all steps |

**Turn budget:** the brief's `BUDGET`, or working alone the size's default (default S 15, M 40, L 80 turns). At the budget, stop and send
your report with what is done and what is left, or a `QUESTION`. Don't grind on.

## Size S
Size S uses the S card in `SKILL.md` and doesn't need this file.

## Project plugins
If the project has `.hstack/plugins/`, list them at the start of a task
(`head -4 .hstack/plugins/*/SKILL.md`). Each is a skill about a library or tool this project uses,
made by `/hstack-learn`. Load one when the task touches what its `description` names, and read its
"Before you rely on this" section first.

## Languages
When the task touches code in one of these languages, read its guide **before the first edit**, and
follow its topic table. Log it as a ROUTE.

| Files | Read |
|---|---|
| `.go`, `go.mod`, `go.work` | `languages/go/SKILL.md` |

More languages will be added here. For a language not listed, the general guides still apply.

## Always, in this order

| When | Read | You write |
|---|---|---|
| A new task or brief arrives | `think/understand/SKILL.md` | `.hstack/work/TASK.md` |
| Before planning, and before the first edit in code you haven't read | `think/explore/SKILL.md` | `.hstack/work/MAP.md` |
| Phase 1, or before any change that touches more than one file | `think/plan/SKILL.md` | `.hstack/work/PLAN.md` |
| From the first edit until the report | `think/focus/SKILL.md` | `.hstack/work/PROGRESS.md` |
| Before you say "done", "fixed", "passes" or "works" | `think/verify/SKILL.md` | `.hstack/work/EVIDENCE.md` |

## When it happens

| Situation | Read |
|---|---|
| You are about to call a library, framework, CLI flag, config key or API you haven't read in this task | `think/sources/SKILL.md` |
| A test, build or command fails and you don't know why within one look | `engineering/debug/SKILL.md` |
| The same approach failed twice | `think/focus/SKILL.md` (attempt rules), then `engineering/debug/SKILL.md` |
| The task is a rename, move, cleanup or restructure that must not change behavior | `engineering/refactor/SKILL.md` |
| You are writing or changing tests (that is: nearly every task) | `engineering/testing/SKILL.md` |
| A migration, schema change, backfill, bulk write, money, or code where two requests could race | `engineering/data/SKILL.md` |
| A handler, endpoint, job or form that takes input, checks access or touches another user's data | `engineering/security/SKILL.md` |
| You are writing a spec, or anything user-facing (messages, emails, UI text) | `engineering/practice/SKILL.md` |
| A decision would change scope, data, dependencies or security; two readings of the brief lead to different code; you're stuck after 3 attempts | `think/escalate/SKILL.md` |

## Rules that apply everywhere
- **Read before you write.** Never edit a file you haven't opened in this task.
- **Facts over memory.** If you can check it (a file, a type, a command's output), check it.
- **One change, one check.** After each change, run the narrowest check that could fail.
- **Say what you didn't verify.** A gap you name is cheap; a gap the reviewer finds is expensive.

## Domains
UI work: also follow `hstack-ui`. Videos: `hstack-motion`. Research before a decision:
`hstack-research`.
