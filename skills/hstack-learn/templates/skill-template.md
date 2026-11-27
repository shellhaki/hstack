---
name: <name>
description: <What it is in one line>. Use when <the situations an agent would recognise: the calls, errors, config or tasks this covers>. Pinned to <name> <version>.
version: <version of the source> (<short commit>)
source: <repo URL> @ <full commit>
learned: <YYYY-MM-DD> by /hstack-learn
focus: <the areas covered>
---

# <name>

<Two or three lines: what it is and how this project uses it.>

## Before you rely on this
Check the installed version (`<the exact command: npm ls <pkg>, go list -m <mod>, <bin> --version>`).
If it isn't <version>, treat everything here as hints, check claims against the installed code
(`think/sources/SKILL.md`), and suggest running `/hstack-learn <name>` again.

## Read next
- `GUIDE.md` when you are using it: how it works inside, and exact calls that are proved to work.
- `FIXES.md` when something behaves wrongly: symptom → cause → file, and how to fix it upstream.
