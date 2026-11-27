---
name: hstack-research
description: Market and technical research under hstack. Use for /hstack-research or whenever a decision needs evidence first ("should we build X", "who competes with Y", "which library or approach for Z", "what do users pay for"). Workers search and read in parallel and write sourced notes; the frontier reads only the notes and writes one report with a recommendation.
purpose: Decisions backed by cited evidence, at small-model reading prices.
author: shellhaki
version: 0.1.0
---

# hstack-research

**Two ways to run this skill.**
- **Alone (`/hstack`, or no hstack mode at all):** you do the research and write the notes and the
  report yourself, one question at a time. Where a step says "the worker" or "the frontier", that is
  you.
- **Team (`/hstack-team`):** if it isn't on yet, do its "Turning it on" steps to pick the worker. Its
  token rules apply: workers read the web (cheap input), the frontier reads only their notes and
  writes the report (expensive output, kept short).

## Files in the user's project (`.hstack/research/<topic>/`)
```
BRIEF.md            the decision and the questions (frontier)
notes/<q>.md        one file per question, every claim sourced (workers)
REPORT.md           the answer, the options, the recommendation (frontier)
```

## The loop

**1. Brief (frontier, about 10 lines).** Fill `templates/brief.md`: the decision this research must
inform, 3 to 6 concrete questions, the scope (market, technical or both), what is already known, and
what would change the decision. A question that no answer would change gets cut.

**2. Gather (workers, in parallel).** Start one worker per question, on the session's worker model.
Each gets the brief, its one question, and "Follow `guides/gathering.md`; write `notes/<q>.md` from
`templates/notes.md`."
- **Claude Code:** the Agent tool with `subagent_type: "hstack-researcher"` (it has web search and
  fetch), all started in the background; wait for their notifications.
- **Muse Code:** `parallel([...])` of `agent()` children, each with `model: "<worker id>"` and an input
  that starts with "Follow `<home>/agents/hstack-researcher.md` as your instructions."
- **Codex:** spawn `hstack_researcher` per question, each with `model: "<worker id>"`. Codex web search must be enabled in the parent session.
If the harness has no web search or fetch, stop and tell the user.

**3. Check the notes (frontier).** Read the notes only, never the sources. Send a question back to its
worker, once, if: a key claim has no source, sources conflict without the conflict being stated, the
newest source is over a year old on a fast-moving topic, or the answer drifted from the question.

**4. Report (frontier).** Write `REPORT.md` from `templates/report.md`, following `guides/synthesis.md`:
the answer first, options compared in one table, a recommendation with confidence and reasons, risks,
what could not be verified, and next steps written so they can become an `hstack` brief directly.

**5. Tell the user** in at most 6 lines: the answer, the recommendation and its confidence, the biggest
risk, and the report's path.

## Rules (both workers and frontier)
- Every claim carries a source link and the source's date. No source, no claim.
- Label each claim **fact** (stated by a primary source), **estimate** (a number someone computed or
  guessed) or **opinion** (a view, review or post). Never upgrade one to another.
- No invented numbers, quotes, companies, prices or user counts. Unknown stays unknown.
- Prefer primary sources: official docs, pricing pages, changelogs, repos, filings, the maker's own
  posts. Use roundups and listicles only to find primary sources.
- Show conflicts between sources; don't average them away.
- Say what could not be read (paywalls, logins, blocked sites) instead of guessing what it says.

## Market vs technical
`guides/gathering.md` lists what to look for in each: competitors, pricing, positioning, users, demand
and gaps for market questions; options, maturity, maintenance, license, performance, integration cost
and known problems for technical ones.

## Hand-offs
- A recommendation to build: the report's "Next steps" become an `hstack` brief.
- A UI direction: the report can name reference sites for `hstack-ui`.
