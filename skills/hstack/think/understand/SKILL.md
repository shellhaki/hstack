---
name: hstack-understand
description: "Understand the task. Part of the hstack skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Understand the task

A strong engineer reads a request and hears what it implies: the error cases, the users who will
see it, the code that already depends on it. You get the same result by writing those things down
on purpose, before you plan.

## Steps
1. **Read the brief twice.** The second time, underline every noun that names an output (a URL, a
   message, a file, a status code, a number) and every verb that names behavior ("copies",
   "retries", "notifies").
2. **Write the goal in one line, in your own words.** If you can't, you don't understand it yet:
   reread the brief and the docs it points to.
3. **List the acceptance criteria.** Copy each one from the brief, then make it testable: add an
   exact example, input then expected output.
   - Vague: "shows an error for bad emails".
   - Testable: `"bob@"` → 400, body `{"error":"invalid_email"}`; the form shows "Enter a valid
     email" under the field.
4. **List the implied requirements.** These are rarely in the brief, and a reviewer always checks
   them. For each one, write what applies, or "n/a, because …":
   - Error cases: invalid input, missing data, the network or a service failing.
   - Empty, loading and first-use states.
   - Who may do this (auth, ownership), and who may not.
   - Existing callers and behavior that must keep working.
   - Limits: size, length, rate, time zones, units, encoding (emoji, non-Latin text).
   - Concurrency: two requests at once, double clicks, retries.
5. **Separate the assumptions from the unknowns.**
   - An **assumption** is a gap you fill with the obvious, conventional choice, usually the one the
     codebase already uses. Mark each one `SAFE` (easy to change later) or `RISKY` (expensive to
     change: data shape, public API, security).
   - An **unknown** is a gap you can't fill from the brief, the code or the docs.
6. **The ambiguity test.** For each unknown and each `RISKY` assumption, ask: "would two reasonable
   answers produce different code that the reviewer might reject?" If yes, it's a `QUESTION`
   (`think/escalate/SKILL.md`). If no, choose, and record it as an assumption.
7. **Check the criteria for conflicts** with each other and with the constraints (no new
   dependencies, off-limits files). A conflict is always a `QUESTION`.

## Common traps
- Copying a link vs copying the text. Absolute vs relative URLs. Local time vs UTC.
- "Update" meaning replace vs merge. "Delete" meaning remove vs hide.
- Counting from 0 or 1. Inclusive or exclusive ranges.
- **Narrowing the input on your own.** If a value makes sense for what the input is (a share can be
  2.5, text can be emoji), handle it; a count of things can't be 2.5. Rejecting inputs the brief allows is a change to
  the spec: ask, or support them. Never ship the restriction and call it a "decision for you".
- **"Characters" a person sees** are grapheme clusters: `"👍🏽"` and `"é"` written as `e` + accent are one
  each. Lengths, limits and cuts of user-facing text count those, never `.length`, bytes or code
  points.
- **Values that make no sense** (a limit of 0, a negative size) are errors to reject loudly, not
  inputs to quietly return an empty result for.
- An existing feature that already does half of this. Find it in `think/explore/SKILL.md` before
  building a second one.

## Write `.hstack/work/TASK.md`
```
GOAL: <one line>
CRITERIA:
  1. <criterion> — example: <input> → <exact output>
IMPLIED:
  - errors: ...  - states: ...  - access: ...  - callers: ...  - limits: ...  - concurrency: ...
ASSUMPTIONS:
  - SAFE: ...
  - RISKY: ... (asked? yes/no)
UNKNOWNS → QUESTIONS: <none, or each one>
OUT OF SCOPE: <what you will deliberately not do>
```
Done when every criterion has an exact example and every `RISKY` item is either asked or justified.
