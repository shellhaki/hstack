---
name: hstack-swarm
description: Solo parallel mode. Use for /hstack-swarm when the work splits into independent parts (separate modules, pages, services or files). The running model plans the split, builds shared contracts first, starts parallel copies of itself on the parts (same model, same hstack guides), has an independent reviewer try to break the result, then merges and verifies. For a frontier directing smaller workers, use /hstack-team-swarm.
purpose: Finish large tasks faster on one model, without letting parallel work skip review.
author: shellhaki
version: 1.0.0
disable-model-invocation: true
---

# /hstack-swarm

You split the work and run it in parallel on **your own model**: no smaller worker, no model picker.
Every part follows the `hstack` guides (`~/.config/hstack/skills/hstack/ROUTES.md`). Use it only when
the parts are truly independent; for one connected change, plain `/hstack` is faster.

## Steps
1. **Understand and explore** the whole task yourself (`think/understand/SKILL.md`, `think/explore/SKILL.md`):
   `.hstack/work/TASK.md` and the project map `.hstack/MAP.md`.

2. **Plan the split** in `.hstack/work/PLAN.md`: 2–6 parts with **disjoint files**. For each part:
   name, owned files, what to build, its tests, its done command. Shared types, contracts, routes or
   schema go in a **part 0**. If two parts need the same file, merge them or move that file to
   part 0. If the split is a judgement call the user cares about, show it to them first; otherwise
   carry on.

3. **Build part 0 yourself**, then run its checks. The other parts build on it.

4. **Fan out.** Start one sub-agent per remaining part, **in parallel and in the background**, on
   your own model (see "By harness"). Give each one:
   - "Follow `~/.config/hstack/agents/hstack-worker.md` as your instructions. SIZE: <S or M>. Build."
   - the task in a few lines and its part from `PLAN.md`
   - its owned files and the rule "edit only your owned files and their tests"
   - its done command

   Wait for completion notifications. Never poll.

5. **Independent review.** Start one `hstack-reviewer` sub-agent on your model with the task, the
   parts and the done commands. It runs the full checks and tries to break the result with new
   tests, without fixing product code, and returns defects with file and line.

6. **Fix.** Send each defect to the part that owns the file (a new sub-agent with the defect lines
   and the part's report), or fix it yourself if it is small or crosses parts.

7. **Merge and verify.** Bring every part into your checkout, run the full done commands once, and
   write `.hstack/work/EVIDENCE.md` (`think/verify/SKILL.md`). Report to the user as `hstack` says.

## By harness
- **Claude Code:** the Agent tool with `subagent_type: "hstack-worker"` and **no `model`**, so it
  runs on your model; reviewer with `subagent_type: "hstack-reviewer"`. Several Agent calls in one
  message run in parallel.
- **Muse Code:** `parallel([...])` of `agent()` children in `muse.workflow`, each with
  `isolation: true` (its own worktree) and no `model` override. Merge each worktree afterwards.
- **Codex:** spawn `hstack_worker` per part and `hstack_reviewer` for review, on your own model.
- **Hermes Agent:** one `hermes chat -m "<your model id>" -w` process per part, in the background,
  each with its part's instructions; paste reports inline (no result refs).
- **No sub-agents in this harness:** build the parts one after another yourself, in the planned
  order, running each part's done command before the next. You still get the split, part 0 and the
  review; only the parallelism is lost.

Cost note: every part runs on your model, so this costs about the same tokens as doing it yourself
(slightly more for the review). What you buy is time. To also cut cost, use
`/hstack-team-swarm` with a smaller worker.
