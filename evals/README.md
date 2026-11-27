# hstack evals

Small tasks that are easy to state and easy to get subtly wrong. Each one probes a piece of judgement
a strong engineer brings without being told: exact money splits, stable pagination, ownership checks,
grapheme-safe text, migrations that keep data, idempotent webhooks under concurrency, local-time
dates across DST, sliding-window rate limits.

Every task has:
```
tasks/<name>/
  task/       what the model gets: README.md (the brief), src/ (starter), test/ (one visible test)
  hidden/     hidden.test.ts: the grading tests, never shown to the model
  solution/   a reference solution, used only to prove the hidden tests are fair
```

## Check the tasks
```
bash evals/validate.sh
```
Every reference solution must pass all hidden tests, and every starter must fail some.

## Run a round
For each task, copy `task/` to two fresh folders and give the same model the same prompt, once
plain and once with "Use hstack: first read ~/.config/hstack/skills/hstack/SKILL.md and follow it".
Tell it to work only inside its folder. Then grade each folder:
```
bash evals/grade.sh <task> <folder>
```
It prints the hidden tests passed, how many tests the model wrote, and which `.hstack/work/` files it
kept (with hstack: did it follow the routes?).

## Turning failures into rules
For every hidden test that fails with hstack on:
1. Find the reason in the model's work (its code, `PROGRESS.md`, `EVIDENCE.md`): did it skip a route,
   read a guide and ignore a rule, or did no guide cover it?
2. Skipped route: make the trigger in `ROUTES.md` more concrete. Ignored rule: move it higher, make it
   a check in `think/verify`. Not covered: add one rule to the guide that should have caught it.
3. Never add a rule that names the eval task; the fix must help on tasks you haven't seen.

`results/` keeps a dated summary of each round.
