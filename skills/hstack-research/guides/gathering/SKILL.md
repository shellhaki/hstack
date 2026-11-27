---
name: hstack-research-gathering
description: "Gathering (worker). Part of the hstack-research skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Gathering (worker)

You answer one question from the brief and write `notes/<q>.md` from `templates/notes.md`. The frontier
will read your notes, not the sources, so the notes must stand on their own.

## How to search
1. Start broad to map the space (3 to 5 searches with different phrasings), then go to primary
   sources: official sites, docs, pricing pages, changelogs, GitHub repos, the maker's own posts.
2. Open and read a page before citing it. A search snippet is not a source.
3. Stop when new sources stop changing the answer, or after about 15 sources, whichever comes first.
4. Record every page you relied on with its URL and date (published or last updated; "undated" if none).

## What to look for
**Market questions**
- Competitors: who they are, what exactly they sell, for whom, how they position it (their own words).
- Pricing: plans, prices, limits, free tiers, from the pricing page itself, with the date you read it.
- Users and demand: who complains about what (forums, reviews, issues), what people pay for or
  switch over, size signals only when a primary source states them.
- Gaps: needs that users state and no competitor meets, with the evidence.

**Technical questions**
- Options: libraries, services and approaches that solve it; what similar products use (from their
  repos, docs or engineering posts).
- For each option: maturity (version, age, release cadence), maintenance (last release, open issues,
  contributors), license, performance (published benchmarks, with their setup), integration cost
  (dependencies, platform support), known problems (issues, post-mortems).
- Check claims in the source code or docs when you can (an API that exists, a flag that is supported).

## Writing the notes
- Answer first, in 2 to 4 lines, then the evidence.
- One claim per line, labeled fact, estimate or opinion, with its source number.
- Put conflicts in their own section: who says what, and which source is more direct.
- List what you could not read or verify.
- Keep it under about 120 lines. Quote only short phrases, in your own words otherwise.

## Never
- Invent a number, quote, company, price or user count.
- Cite a page you didn't open.
- Present an estimate or opinion as a fact.
- Answer a different question than the one you were given.
