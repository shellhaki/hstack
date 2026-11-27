# <name> <version>: where to fix what

## Symptoms
| Symptom (what you see) | Cause | Where | Workaround | Upstream |
|---|---|---|---|---|
| <exact error text or behavior> | <why, in one line> | `<file:line>` | <what to do in your own code> | <issue or PR link, or "not reported"> |

## When it's a bug in <name>, not in your code
1. **Prove it's theirs:** a minimal reproduction that uses only <name>, at the installed version. If it
   only fails with your code around it, it's probably yours (`engineering/debug/SKILL.md`).
2. **Find the cause in their code:** use the table above and `GUIDE.md` to go straight to the file.
   State it as "X happens because Y, shown by Z".
3. **Check it isn't known:** search their issues and pull requests
   (`gh issue list -R <repo> --search "<words from the error>"`, and closed ones). If it's fixed in a
   newer version, say so and stop: upgrading is the fix.
4. **Explain it to the user:** the symptom, the cause with `file:line`, the workaround for now, and
   whether a fix upstream is worth it.
5. **Prepare the fix, only if the user wants it:** fork, branch, the smallest change at the cause, and
   a test that fails before and passes after, following their rules below. Draft the issue and the
   pull request text.
6. **Stop before anything public.** Show the user the diff and the drafts. Open the issue or pull
   request only when they say so, from their account.

## Their contribution rules
- Tests: `<command>`. Lint: `<command>`.
- Style and commits: <conventional commits, sign-off (DCO), changesets, …>.
- PR rules: <template, linked issue required, who reviews>.
- Source: `<CONTRIBUTING.md path>`.
