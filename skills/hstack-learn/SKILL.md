---
name: hstack-learn
description: Compile a codebase into a ready-to-use agent skill. Use only when the user invokes /hstack-learn with a local path, a repo URL or a dependency name. Reads the code at the exact version in use, writes a skill (how it works inside, how to use it, where to fix what, how to fix it upstream), proves its usage examples against the installed version, and installs it for this agent globally or for this project only.
purpose: Give agents a real understanding of a library or tool, beyond its README, pinned to the version in use.
author: shellhaki
version: 0.1.0
disable-model-invocation: true
---

# /hstack-learn

Turn a codebase into a skill another agent session can use: what it is, how it works inside, how to
use it correctly, and where to fix it when it falls short. A README says what the authors meant; the
code says what actually happens. This skill reads the code.

Follow the `hstack` guides while you work (`~/.config/hstack/skills/hstack/ROUTES.md`), especially
`think/explore/SKILL.md`, `think/sources/SKILL.md` and `think/verify/SKILL.md`. Size: M.

## 1. Find the source and its exact version
The argument is one of:
- **A local path:** use it as is. Version: `git -C <path> describe --tags --always`.
- **A repo URL:** clone it.
- **A dependency name** ("opencode", "remotion"): find it in this project's lockfiles and manifests
  (`package.json` / lockfile, `go.mod`, `pyproject.toml` / `uv.lock`, `Cargo.toml` / `Cargo.lock`, a
  binary on PATH with `--version`), then its repo from the package metadata (`npm view <pkg>
  repository.url`, the module path, the PyPI or crates.io page).

Clone at **the version in use**, not the default branch:
```
git clone --depth 1 --branch <tag> <repo> ~/.cache/hstack/learn/<name>@<version>
```
If no tag matches the version, clone the default branch, find the commit for that release, and say so.
Record the commit (`git rev-parse HEAD`).

If two parts of the project use different versions (for example a server at 2.4.1 and its SDK at
1.19.6), note it: mismatches like that are often the most useful thing the skill can tell an agent.

If the repo ships its own agent guide (`AGENTS.md`, `CLAUDE.md`, `.hstack/GUIDE.md`, `llms.txt`), read
it first and build on it. Treat it as a hint and check it against the code like everything else.

## 2. Ask the user two things, in one message
1. **Focus:** "What do you use <name> for here? I'll cover <the 2–4 areas you'd guess from how this
   project uses it> and skip <the rest>. OK?" A focused skill is small and accurate; a whole-repo
   summary is neither.
2. **Where to install:**
   - **This project only:** `.hstack/plugins/<name>/` (loaded by `hstack` in this project).
   - **Globally, for this agent:** the agent's own skills folder, so every project gets it:
     Claude Code `~/.claude/skills/<name>/`, Muse Code and Codex `~/.agents/skills/<name>/`,
     Hermes `${HERMES_HOME:-~/.hermes}/skills/<name>/`.

   Recommend "this project" unless the user uses it everywhere.

## 3. Map the code (focus areas only)
Follow `think/explore/SKILL.md`, but over the library instead of the project:
- Entry points: the public exports, CLI commands, server routes, config schema.
- For each focus area, trace one real call from the public API down to where the work happens.
  Write down the files and functions on that path.
- The tests: they are the most reliable description of real behavior. Note which test shows each
  behavior you describe.
- Defaults, limits and errors: what happens on bad input, timeouts, missing config.
- Known problems: open issues and recent fixes that touch the focus areas
  (`gh issue list -R <repo> --search "<area>" --limit 20`, the CHANGELOG).
- How it takes contributions: `CONTRIBUTING.md`, the test and lint commands, PR rules, sign-off.

Every claim you will write needs a `file:line` or a test name. If you can't point to one, leave the
claim out.

## 4. Write the skill
Create the install folder from step 2 and fill the three templates in `templates/`:
- `skill-template.md`, saved as `SKILL.md`: the trigger and the version pin. Its `description` must say when to use it in words an
  agent would match ("calling the opencode server, sessions, events"), not marketing.
- `GUIDE.md`: how it works inside and how to use it, with exact working calls.
- `FIXES.md`: symptom → cause → file, and how to fix it upstream.

Keep the whole skill under about 400 lines. Link to `file:line` in the cloned source instead of
pasting code.

## 5. Prove the usage examples
For each example in `GUIDE.md` under "Use", write a small probe script in `.hstack/work/learn/` and run
it against the installed version (start the server, make the call, read the output). Fix the guide
wherever a probe disagrees, and run it again. Record each probe and its result in
`.hstack/work/EVIDENCE.md`. An example you couldn't run gets marked `(not run: <why>)` in the guide.

## 6. Install and report
- **Project:** make sure `.hstack/plugins/` is not gitignored if the user wants to share it with the
  team; mention it.
- **Global:** check the folder name is free; if a skill with that name exists, ask before replacing it.

Report in at most 6 lines: where it's installed, the version and commit it's pinned to, the focus
areas, how many usage examples were proved, and the most useful finding (often a mismatch or a
known bug). Tell the user that a new session picks it up.

## Updating
When the version in use changes, the skill's own `SKILL.md` tells agents to treat it as hints and to
suggest `/hstack-learn <name>` again. Rerunning it replaces the skill in place, keeping the same focus
unless the user changes it.
