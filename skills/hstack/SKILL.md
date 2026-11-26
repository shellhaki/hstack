---
name: hstack
description: Senior-engineer mode. Use for /hstack (turns it on for the session and picks the smaller worker model) and, once it is on, for real implementation work (features, multi-file changes, test suites); skip it for one-line fixes and questions. The frontier writes the brief, a smaller worker plans, builds and tests, and the frontier reviews and corrects.
purpose: Same results as the frontier model alone at about half the cost (measured 53% cheaper on benchmark 2).
author: shellhaki
version: 0.3.0
---

# hstack: senior engineer mode

The worker does the work. You decide **why** and **what**, check the **how**, and correct course. Your output tokens cost many times what the worker's do, so write decisions, not text. **Never write or edit product code or tests yourself.**

Measured result: on a production waitlist backend, Opus directing a Haiku worker cost 53% less than Opus alone, with the same hidden-test results (`benchmarks/02-waitlist-backend`).

## Turning it on (first `/hstack` in a session)
Do this once per session, before any task. If a worker is already set in this session, skip it.

1. **Get the frontier and its model list.** The frontier is the model running this session; your system prompt or status line names it (for example `claude-opus-5-5`, `muse-spark-1.3-contributor` or `gpt-6-luna`). Run `hstack models --frontier <frontier id> --json`. The harness is picked from the id's prefix (`claude-*`, `muse-*`, `gpt-*`/`codex-*`, `hermes-*`). **In Hermes always pass `--agent hermes`:** its model ids overlap other harnesses (e.g. `muse-spark-1.3` is served by both Muse and Hermes), so the prefix alone can't pick the harness. The output is the harness's own live list, most to least capable, as `[{id, name, alias, note, rank}]`; the stderr line `source:` says whether it came from the local catalog or the built-in list. Models with the same `rank` are one tier: a `-contributor` variant shares its base's rank, so neither is ever a worker for the other. A higher `rank` is a smaller model. If `hstack` isn't on PATH or the command fails, read `<home>/models/<agent>.json` instead (`<home>` is `~/.config/hstack` or this repo) and match by `id`, `alias` or `names`. Never offer another harness's models.
   - **Frontier not in the list:** don't refuse. Say one line, "hstack doesn't see <frontier> in its list. Models: <aliases, most to least capable>.", and let the user name any model they say is smaller.

2. **Smallest model already?** If the frontier is in the list and no model has a higher rank than its rank, reply in one line, "hstack inactive: <model> is already the smallest, so I'll work normally.", and stop.

3. **Ask for the worker.** If the frontier is in the list, the valid workers are the models with a higher `rank` than the frontier. Ask "Which smaller model should do the work?" and offer exactly those, by `alias` (or `id` when there is no alias). Suggest a default: the list's `default_worker` if it is one of them, else the first valid worker. If the frontier isn't in the list, offer the whole list.

4. **Validate, and keep asking until it's valid.**
   - Match the answer loosely against each model's `id`, `alias` and `name` (and `names` in a built-in file). Ignore case, spaces and the words "claude", "muse", "codex" and "gpt", so "Haiku 5.5", "haiku" and "claude-haiku-5-5" all match Haiku, "Ember", "muse ember" and "muse-ember-1.0" all match Ember, and "Luna", "gpt-6 luna" and "codex luna" match Luna.
   - **Not in the list:** if the user says it is smaller than the frontier, accept it and note in the confirmation that it wasn't in the list. Otherwise reply "That model isn't in the list. Options: <aliases of models below the frontier>", then ask again.
   - **Not smaller than the frontier** (both in the list, same or higher rank): reply "<model> isn't smaller than <frontier>, pick one of: <aliases below>", then ask again.
   - Repeat until it's valid. Don't guess for the user.

5. **Confirm and remember.** Reply in one line: `hstack active · <frontier> directs, <worker> builds (/hstack-swarm for parallel workers)`. Keep the worker for the rest of the session. In Claude Code pass its `alias` as the Agent tool's `model`; in Muse Code pass its `id` as the `model` of `agent()` in `muse.workflow`; in Codex pass its `id` as the spawn model; in Hermes start a separate `hermes chat -m "<worker id>"` process for the worker (same shape as Muse below).

Then continue with the task the user gave, if any.

## How the worker thinks
The worker doesn't load everything at once. Its instructions point it to
`skills/hstack/ROUTES.md`, a routing table that names one guide per situation:
- `think/`: understand, explore, plan, sources, focus, verify, escalate.
- `engineering/`: practice, debug, refactor.

Each guide makes the worker write a file in `.hstack/work/`:
- `TASK.md`: criteria with exact examples, implied requirements, assumptions.
- `MAP.md`: commands, test baseline, the template to copy, callers at risk.
- `PLAN.md`
- `PROGRESS.md`
- `EVIDENCE.md`: each criterion with its proof.

Review these short files instead of trusting the report; they're cheap to read and show where its
thinking went wrong.

## 0. Size gate
Delegate only when the task needs real implementation work: new features, multi-file changes, test suites. For a one-line fix, a question or a tiny edit, do it yourself. Delegating costs more than it saves there.

## 1. Brief (you, at most about 15 lines)
```
WHY: <one line>
WHAT (acceptance criteria, numbered, testable; point to existing docs or specs instead of restating them):
  1. ...
CONSTRAINTS: <stack, off-limits files, no new deps, ...>
RISKS I WILL REVIEW: <auth, data loss, money, user-facing output, ...>
DONE WHEN: <exact commands, e.g. npm test, tsc>
```
DONE WHEN must include the tests that cover every changed file. A typecheck alone never counts: it misses changed strings, names, paths and IDs. For a bulk or scripted edit (rename, find-and-replace, codemod), require a test baseline before the edit and the tests of every touched package after each batch, with no new failures.

## 2. Plan (worker)
Start the worker (see "Delegation by harness" below) with the brief plus "Phase 1: plan only." The worker explores, writes `PLAN.md`, and returns a plan report of at most 20 lines.

Review it against your criteria and risks. If something looks off, open `.hstack/work/TASK.md`
(missed implied requirements, a wrong RISKY assumption) or `MAP.md` (wrong template, no baseline).
Then answer the worker:
- `APPROVE: build it`, or
- `REVISE:` followed by at most 8 lines of exact changes.

Approve "good enough". Don't polish.

## 3. Build (worker)
The worker writes tests first, implements, runs the done commands until they're green, reviews its own work against the brief, and returns a done report of at most 25 lines:
- files changed
- tests run and their real results
- known issues
- areas that need review

## 4. Review (you)
1. Run the done commands yourself once. Their output is cheap input; your words are expensive output.
2. Read `.hstack/work/EVIDENCE.md`: every criterion needs evidence, and NOT VERIFIED lists the gaps. Then read only the code files that cover your RISKS line.
3. If something is wrong, send **one** correction round to the worker. Name the exact defect, file and expected behavior in at most 10 lines, then check again.
4. If it's still wrong after that, give a more specific correction (an exact example, file or line). If the worker escalates a genuine design question, answer that decision only.

## 5. Report
Tell the user in at most 6 lines:
- what was built
- final check results (real output)
- what you corrected
- anything still open

Don't commit or push unless asked.

## Delegation by harness

**Claude Code.** Start the worker with the Agent tool: `subagent_type: "hstack-worker"`, `model: "<worker alias>"`. Send APPROVE, REVISE and corrections to **the same worker** with SendMessage, so it keeps its context.

**Muse Code.** Use `agent()` in `muse.workflow`: `agentType: "general-purpose"`, `model: "<worker id>"`, and an `input` that starts with "Follow `<home>/agents/hstack-worker.md` as your instructions." followed by the brief. A Muse child can't be messaged again, so each step is a new child that reads the files the last one left:
- **Plan:** "Phase 1: plan only." The child writes `.hstack/work/` (`TASK.md`, `MAP.md`, `PLAN.md`) and returns its plan report.
- **Build:** a new child with the brief, "Phase 2: build. Read `.hstack/work/PLAN.md`.", and your `APPROVE` or `REVISE` lines. Pass the plan child's `result.ref` so it can read the plan report.
- **Correction:** a new child with the brief, the done report's `ref`, and your exact correction.
Use `isolation: true` only for parallel work (see `hstack-swarm`); a single worker shares your checkout.

**Codex.** Ask Codex to spawn the custom agent `hstack_worker` with `model: "<worker id>"` and the brief as its task, with "Phase 1: plan only." Send APPROVE, REVISE and corrections as follow-up input to the same agent thread, so it keeps its context. The reviewer is `hstack_reviewer`.

**Hermes Agent.** Start the worker as a separate `hermes chat` process on the worker model: `hermes chat -m "<worker id>"` (`-p <profile>` to target a profile, `--in <dir>` to scope the worktree, `-s hstack` to preload this skill), with an input that starts with "Follow `<home>/agents/hstack-worker.md` as your instructions." followed by the brief. A Hermes worker can't be messaged again, so each step is a new process that reads the files the last one left (same shape as Muse Code above: plan process, then a build process reading `.hstack/work/PLAN.md`, then a correction process). Paste the previous report inline: Hermes has no result refs. Use `-w` only for parallel work (see `hstack-swarm`); a single worker shares your checkout.

## Token discipline
- Never read whole diffs or logs. Trust the worker's tests and spot-check your risk areas.
- Keep one worker per task and continue it (Claude Code: SendMessage; Muse Code: a new child that reads `.hstack/work/` and the last result; Hermes: a new `hermes chat` process that reads `.hstack/work/` and the last report), so you don't re-explain.
- Keep briefs and directives short. Exact examples beat explanations.

## Risks and mitigations
| Risk | Mitigation |
|---|---|
| The worker's spec drifts from what the user meant | Your brief states acceptance criteria up front, and plan review checks against them |
| The worker's tests only confirm its own mistakes | You run the checks yourself, spot-check your risk areas, and in swarm mode an independent reviewer tries to break the work |
| Review rounds add up | One correction round by default, and short directives |
| A bulk edit passes the typecheck but breaks behavior (strings, names, paths that tests or other code still expect) | Baseline the tests first, run the tests of every touched package after each batch, and diff the failures against the baseline |
| The task is too vague for a small model | Stay involved longer: more plan iterations, still terse |
