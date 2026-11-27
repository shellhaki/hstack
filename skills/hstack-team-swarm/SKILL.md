---
name: hstack-team-swarm
description: Parallel orchestration. Use for /hstack-team-swarm when hstack-team is active and the work splits into independent parts. The worker plans the split, several workers build the parts in parallel, and an independent reviewer tries to break the result.
purpose: Finish large tasks faster without letting parallel work skip review.
author: shellhaki
version: 0.2.0
disable-model-invocation: true
---

# /hstack-team-swarm

The frontier directs several smaller workers in parallel. For one model splitting its own work across
parallel copies of itself, use `/hstack-swarm`.

Use this for tasks that split into independent parts (separate modules, services or files). If `/hstack-team` isn't on yet, do its "Turning it on" steps first to get a worker model. Everything in the `hstack-team` skill still applies; only the build phase changes.

1. **Brief** as in `hstack-team` section 1.

2. **Plan the split.** Start one `hstack-worker` (your worker model) with the brief and this instruction:

   "Phase 1: plan only, and split the work into 2-6 independent parts with disjoint files. For each part give: name, owned files, what to build, its tests, its done command. Shared types and contracts go in a 'part 0' you build first."

   Review the split. Parts must not share files. Approve or REVISE as usual.

3. **Part 0 (if any).** Continue the same worker: "Build part 0 only, then report."

4. **Fan out.** Start one `hstack-worker` per remaining part, **in parallel and in the background**, on the same worker model. Give each one:
   - the brief
   - its part
   - its owned files
   - the rule "edit only your owned files and their tests"
   - "Phase 2: build it, test first, run your done command, then report"

   Wait for completion notifications. Never poll.

5. **Independent review.** Start one `hstack-reviewer` on the worker model with the brief and the list of parts. It runs the full checks and tries to break the work with new tests, without fixing product code. It returns defects with file and line.

6. **Fix.** Send each defect to the worker that owns that file, as one round of exact corrections.

7. **Review and report** as in `hstack-team` sections 4 and 5. Run the full done commands yourself once, and spot-check your RISKS.

## In Muse Code
Same steps, with `muse.workflow` (see "Delegation by harness" in `hstack-team`):
- **Plan and part 0:** separate `agent()` children, the build child reading `.hstack/work/PLAN.md`.
- **Fan out:** `parallel([...])` of one `agent()` per part, each with `isolation: true` so every part builds in its own worktree, `model: "<worker id>"`, and the part's instructions above.
- **Review:** one `agent()` whose input starts with "Follow `<home>/agents/hstack-reviewer.md` as your instructions."
- **Fix:** a new child per affected part, with that part's result `ref` and the exact corrections.
- **Merge:** bring each part's worktree changes into your checkout, then run the full done commands once.

## In Codex
- **Parts and review:** spawn `hstack_worker` per part, in parallel, with `model: "<worker id>"`, and `hstack_reviewer` on the worker model for review, as in `hstack-team` ("Delegation by harness").

## In Hermes Agent
Same steps, as separate `hermes chat` processes (see "Delegation by harness" in `hstack-team`):
- **Plan and part 0:** one process with the split instruction, then a new process reading `.hstack/work/PLAN.md` for part 0. Paste the previous report inline; there are no result refs.
- **Fan out:** one `hermes chat -m "<worker id>" --in <part-workdir>` process per part, in parallel and in the background, each with its part's instructions above. Use `-w` when the parts need isolated worktrees.
- **Review:** one process whose prompt starts with "Follow `<home>/agents/hstack-reviewer.md` as your instructions."
- **Fix:** a new process per affected part, with the defect lines and the exact corrections.
- **Merge:** bring each part's changes into your checkout, then run the full done commands once.

Cost note: every part's tokens are at the worker's price. Your share is the brief, approvals and reviews. Keep the parts truly independent, so you never have to mediate conflicts.
