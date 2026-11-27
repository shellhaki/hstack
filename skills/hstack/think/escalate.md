# When to ask, and how

A strong engineer knows which decisions are theirs and which aren't. Smaller models tend either to
push through a decision they shouldn't make, or to ask about things they could look up. Both waste
the reviewer's time. Use these rules.

## Ask (send a `QUESTION`) when
- A decision changes **scope, the public API, the data model, a dependency or security** and the
  brief doesn't decide it.
- **Two reasonable readings** of the brief lead to different code (`think/understand.md`, the
  ambiguity test).
- Two criteria, or a criterion and a constraint, **conflict**.
- The next step is **destructive or external**: deleting data, a migration on shared data, calling a
  paid or real service, needing a secret.
- You failed **3 attempts** on one problem (`think/focus.md`).
- The evidence contradicts the brief: the code doesn't work the way the brief assumes.

## Don't ask when
- The answer is in the code, the docs or the installed library. Look it up (`think/explore.md`,
  `think/sources.md`).
- It's a conventional choice, and the codebase already has a pattern for it. Follow the pattern and
  record it as an assumption.
- It's a style detail with no effect on behavior.

## How to ask
Make it answerable in one line. Do the thinking: give the options and your recommendation.
```
QUESTION: <the decision, one line>
CONTEXT: <what you found, with file:line or command output, at most 3 lines>
OPTIONS:
  A) <option> — <consequence>
  B) <option> — <consequence>
RECOMMEND: <A or B> because <one reason>
MEANWHILE: <the work you can continue that doesn't depend on the answer, or "blocked">
```
Then stop, or continue only the MEANWHILE work. When the answer comes, record it in `TASK.md` under
ASSUMPTIONS as decided.
