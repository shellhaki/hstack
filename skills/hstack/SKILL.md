---
name: hstack
description: Engineering superpowers for any model, working on its own. Use for /hstack, and for any real coding task once it's on (features, bugs, refactors, UI, tests). Routes to thinking guides (understand, explore, plan, verify, debug…) and to domain skills (hstack-ui, hstack-motion, hstack-research, hstack-update). For a frontier model directing a smaller worker, use /hstack-team instead.
purpose: Make a smaller model work like a strong senior engineer, with no orchestration needed.
author: shellhaki
version: 1.0.0
---

# hstack

hstack is a set of guides that make a model work like a strong senior engineer: understand the task
before writing, copy the codebase's own patterns, check facts instead of remembering them, and prove
the work before calling it done. **You, the model running this session, use them directly.** No
second model, no briefs, no approval rounds.

## Turning it on
On `/hstack`, reply in one line: `hstack on · guides active (/hstack-team to direct a smaller worker
instead)`. Then continue with the user's task, if any.

## How you work with it
1. **Read `ROUTES.md` next to this file** (`~/.config/hstack/skills/hstack/ROUTES.md` after install)
   at the start of every real task. It names the guide for each situation; read a guide only when its
   row applies.
2. **Size the task** with the size table in `ROUTES.md`: S, M or L. The size decides how much of the
   process you run. A one-line fix or a question needs none of it: just do it.
3. **Keep the work files** each guide asks for in `.hstack/work/` (TASK, MAP, PLAN, PROGRESS,
   EVIDENCE) for M and L. They keep you on track over a long task. Don't commit them.
4. **You are the reviewer of your own work.** Wherever a guide says "the reviewer", that is you
   before you report, and then the user. Escalations (`think/escalate.md`) go to the user.
5. **Report to the user** in at most 8 lines: what changed, the checks you ran with their real
   results, what you didn't verify, and anything they must decide.

## Domains
Each is its own skill; load it when the task is in its domain.

| Task | Skill |
|---|---|
| Builds, restyles or reviews an interface | `hstack-ui` |
| A promo, launch or explainer video (only when the user invokes `/hstack-motion`) | `hstack-motion` |
| A decision that needs evidence from the web (market, competitors, libraries) | `hstack-research` |
| Getting the latest hstack (`/hstack-update`) | `hstack-update` |
| A frontier model directing a cheaper worker (`/hstack-team`) | `hstack-team` |
| Work that splits into independent parts, built in parallel by copies of you (`/hstack-swarm`) | `hstack-swarm` |
| A frontier directing several smaller workers in parallel (`/hstack-orchestrator-swarm`) | `hstack-orchestrator-swarm` |
