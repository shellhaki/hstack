---
name: hstack
description: Engineering superpowers for any model, working on its own. Use for /hstack, and for any real coding task once it's on (features, bugs, refactors, UI, tests). Routes to thinking guides (understand, explore, plan, verify, debug…) and to domain skills (hstack-ui, hstack-motion, hstack-research, hstack-update). For a frontier model directing a smaller worker, use /hstack-team instead.
purpose: Make a smaller model work like a strong senior engineer, with no orchestration needed.
author: shellhaki
version: 1.3.0
---

# hstack

**Size S (one function, one component, a contained bug, up to ~3 files): this file is all you need.
Do not open `ROUTES.md` or any guide in `think/` or `engineering/`; they repeat what is here. Open a
guide only when a trigger in section 4 fires.**

On `/hstack`, reply `hstack on · guides active (/hstack-team to direct a smaller worker instead)`,
then do the task.

## 1. Size
- **S:** the S card (section 2). When unsure between S and M, pick S.
- **M** (a feature over several files) and **L** (a new subsystem, a migration on shared data, auth,
  money flows): follow `ROUTES.md` next to this file (`~/.config/hstack/skills/hstack/ROUTES.md`).
- A one-line fix or a question: just do it.

## 2. The S card
**Budget: about 6 tool calls.** Every call resends the whole conversation, so steps cost more than
words. Combine them:

1. **One call to read everything:** `cat README.md src/<file> test/<file>` (and run the tests in the
   same command: `…; bun test 2>&1 | tail -5`). Note the counts.
2. **List the cases** (in your head or a comment, not a file):
   - each requirement, with an exact input and the exact expected output
   - boundaries: empty, one, the limit, one over the limit
   - values that make sense, expected to **work** (see the trap table)
   - values that make no sense, expected to **throw**: a count that isn't whole (2.5 seats), a limit
     of 0, a negative size, NaN
3. **Write 6–12 tests** from that list, expected values worked out by hand, then the code: one write
   per file, then one test run. More tests isn't better; one per case is.
4. **Prove the main test can fail, in one command:**
   `mkdir -p .hstack/work/tmp && cp src/f.ts .hstack/work/tmp/ && sed -i '' 's/<good>/<broken>/' src/f.ts && bun test 2>&1 | tail -3; cp .hstack/work/tmp/f.ts src/f.ts && bun test 2>&1 | tail -3 && rm -rf .hstack/work/tmp`
   (GNU sed: `sed -i` without `''`). The first run must fail, the second pass. Never write to `/tmp`.
5. **Trap check:** read your code once against the trap table. Fix what doesn't match.
6. **Report** in at most 8 lines: what changed, test counts (before → after), what you didn't
   verify.

At size S, skip everything else: no work files, no demo scripts, no fuzzing or property runs, no
typecheck the project doesn't already have, no re-running a passing suite "to be sure".

## 3. The trap table (every size)
For each numeric input, first say what it **is** (a count, an amount, a share, a limit).

| Case | Right answer |
|---|---|
| Cut `"see you soon"` to 5 characters with `…` | `"see…"`: keep 4, `trimEnd()`, add `…` |
| Length of `"👋🏾"`, `"🇯🇵"`, `"ñ"` (n + tilde) | 1 each: count graphemes (`Intl.Segmenter`), never `.length` |
| Split 100 cents 3 ways | `[34, 33, 33]`: integer cents, parts add up exactly |
| Weights `[0.25, 2.75]` | work: shares and weights can be fractions |
| `seats: 2.5` | rejected: a count of things is a whole number |
| Timestamps from other systems | ISO with `Z`, offsets, fractions, epoch seconds (10 digits), epoch ms (13 digits), stray spaces; only garbage becomes NULL |
| Equal sort keys, then paging | every item exactly once: break ties with a unique id |
| The same event or request twice, or at once | applied once |
| Read-then-write with `await` in between | serialise it or make it atomic |
| A date for a user | the user's time zone, not the server's |

## 4. Triggers (any size)
- Go code: `languages/go/SKILL.md`.
- A schema change, migration or bulk write: `engineering/data/SKILL.md`.
- A handler taking input or touching another user's data: `engineering/security/SKILL.md`.
- A failure you can't explain after one look: `engineering/debug/SKILL.md`.
- A library API you haven't read in this task: `think/sources/SKILL.md`.
- `.hstack/plugins/` exists: `head -4 .hstack/plugins/*/SKILL.md`, load what matches.
- UI work: `hstack-ui`. Videos: `hstack-motion`. Web research: `hstack-research`. Turning a library
  into a skill: `hstack-learn`. Updating: `hstack-update`. Directing a cheaper worker:
  `hstack-team`. Parallel parts: `hstack-swarm` / `hstack-team-swarm`.
