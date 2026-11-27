---
name: hstack-ui
description: UI work under hstack. Use for /hstack-ui or whenever a task builds, restyles or reviews any interface (landing pages, app screens, dashboards, settings, forms). The worker writes a design system from compiled design principles (learned from nine strong products), builds only from that system and a component library, and the frontier reviews screenshots before anything is accepted.
purpose: Production-grade UI from a small model, with no invented styling (no "AI slop").
author: shellhaki
version: 0.5.0
---

# hstack-ui

If hstack isn't on in this session yet, do the "Turning it on" steps in the `hstack` skill first to
pick the worker, then continue here. The brief, review and token rules of `hstack` all apply; this
skill adds the UI-specific steps.

The worker never makes a UI decision on its own. Every choice comes from one of three places, and
anything none of them answers is a `QUESTION`, never a guess:

1. `.hstack/ui/DESIGN.md`: the project's design system (the look).
2. Prebuilt components: shadcn/ui on React + Tailwind by default, browsed and installed as
   `guides/components.md` describes. **Never hand-build a component** that a registry has (button,
   input, table, dialog, card, menu, sidebar, chart, and the rest); compose pages from installed ones.
3. A page recipe from `library/recipes.md`: what a page of that kind contains, in what order, and which
   component fits which job.

Motion and imagery follow the same rule: animated backgrounds and animations come from motion
registries (`guides/motion.md`), smooth scrolling from Lenis where it fits (`guides/scroll.md`),
colors from palette sources checked by a script (`guides/color.md`), icons from one icon library and logos from the brands themselves
(`guides/icons.md`), each chosen once in `DESIGN.md`.

## Files in the user's project (`.hstack/ui/`)
```
.hstack/ui/
  DESIGN.md            the design system for this project; every later task reads this
  references/<site>/   screenshots of a site the user named (only then)
  screens/<page>/      screenshots of what the worker built, for review
```
Add `.hstack/ui/references/` to `.gitignore`: those are other sites' screenshots, reference only.

## Fast path (most UI tasks)
Once `.hstack/ui/DESIGN.md` is approved and the theme is in place, UI work is ordinary hstack work
sized S or M (`hstack` skill, step 0): a new section, a restyle, a form, one page. For those:
- Skip steps 1 to 4 entirely. Don't reread the principles, don't capture any site, don't touch the
  theme.
- The worker reads `DESIGN.md` and `library/recipes.md` (only the recipe it needs), builds (step 5),
  runs `check-prebuilt.mjs` and the project's checks.
- **Screenshots: one contact sheet for the whole task,** not one review per page. S: the changed
  pages at 1440 only. M: at 1440 and 390. A plain full-page screenshot is enough (`--no-tiles` skips the section tiles):
  `node <skill>/vendor/taste-skill/shoot.mjs --url <url> --w 1440 --no-tiles --out .hstack/ui/screens/<page>-1440.png --profile .hstack/ui/.chrome`
- The frontier reviews the sheet once, with `guides/review.md`.

Use the full loop below only for a new project (no `DESIGN.md`), a redesign, or a change to
`DESIGN.md` itself.

## The loop

Steps 1 to 3 are **gates, not suggestions**. No page is planned or built until `.hstack/ui/DESIGN.md`
exists and the frontier has approved it on its own; never fold the design system into a build plan.
Every build brief names `.hstack/ui/DESIGN.md` as its only source of styling.

**0. Is there an approved `.hstack/ui/DESIGN.md`?** Yes: skip to step 4. No: do steps 1 to 3 first,
even if the user's request only asks for a page.

**1. Principles, not examples.** The design knowledge is already compiled in
`guides/design-principles.md`: how to choose type, color, layout, imagery, components, motion and
copy for a product, what never to choose, and the nine sites it was learned from (Linear, Vercel,
Stripe, Raycast, Resend, Figma, Notion, Supabase, Brimble) as evidence, never as templates. The worker
reads it in full; no capture is needed.
- **The user names a site they like:** capture it (step 2) and take its principles, never its look.
- **The user wants to keep their current UI:** that UI is the only reference, and matching it is the
  point. Capture it (step 2) and write `DESIGN.md` from it.

**2. Capture (only for step 1's two cases; free: no model tokens).** Home page plus one screen that
fits the project, at 1440 and 390 wide:
```
node <skill>/vendor/taste-skill/shoot.mjs --url <url> --w 1440 --out .hstack/ui/references/<site>/<screen>-1440.png --tiles .hstack/ui/references/<site>/<screen>-1440 --profile .hstack/ui/.chrome
node <skill>/vendor/taste-skill/shoot.mjs --url <url> --w 390  --out .hstack/ui/references/<site>/<screen>-390.png  --tiles .hstack/ui/references/<site>/<screen>-390  --profile .hstack/ui/.chrome
```
Needs Node 22+ and Chrome, Edge or Chromium. Without an installed Chrome, point `CHROME_PATH` at
another Chromium build, such as Playwright's
(`~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/*`). If a site blocks
the capture or needs a login, say so; never invent what it looks like.

**3. DESIGN.md (the most important review).** The worker writes it by following
`guides/writing-design-md.md`: the product lines (trade, mood words, the product's own material,
light or dark), then each choice with the product line it follows from, then the tokens, filled
into `templates/design-system.md`'s template. The frontier reviews the text against
`guides/design-principles.md` and approves it or sends exact fixes before any page is built: a wrong
system makes every page wrong. The user can edit `DESIGN.md` at any time; it stays the single source.

**4. Theme (once per project, or after `DESIGN.md` changes).** The worker turns `DESIGN.md`'s tokens into the library's theme variables once
(`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--radius`, fonts), then runs
`node <skill>/tools/contrast.mjs <the css file>`, which must exit 0 (`guides/color.md`).

**5. Build.** Pick the page recipe, find each part in the registry (`guides/components.md`: blocks
first, then components), install it with `shadcn add`, and compose the page from installed parts,
styled only through `DESIGN.md`'s theme. Add the one animated background `DESIGN.md` names
(`guides/motion.md`) and icons from its icon library (`guides/icons.md`). No new colors, sizes, radii, shadows or fonts, and no
hand-built component. Something no registry has, or a pattern `DESIGN.md` doesn't cover, is a
`QUESTION` to the frontier, answered by adding it to `DESIGN.md` first.

**6. Verify.** First the prebuilt gate: `node <skill>/tools/check-prebuilt.mjs .` must print `ok`.
It fails on any raw `<button>`, `<input>`, `<textarea>`, `<select>`, `<table>`, `<dialog>`, `<label>`,
`<hr>`, ARIA widget roles or click handlers on plain elements outside the ui folder, and on files in
the ui folder that are not registry items. Fix every finding by installing the registry part; never
by renaming or hiding the element. Then the worker captures its own pages into `.hstack/ui/screens/<page>/` the same way (desktop
and phone), runs the project's checks, and checks its copy against `<skill>/vendor/taste-skill/copy-tells.md`.

**7. Review (frontier).** Review `.hstack/ui/screens/` against `DESIGN.md` using
`guides/review.md`, including the clone check: no page may read as a copy of a site in the principles, or as an AI default. One correction round
with exact fixes (file, element, expected value); then a more specific fix, never a vague "make it nicer".

**8. Done.** Accept, or commit if asked. A later "make it denser" or "more like X" changes `DESIGN.md`
first, then the pages.

## Rules that prevent slop
`guides/anti-slop.md` lists the banned defaults. The short version: one system per project (one radius family,
one button shape, one spacing scale, one type scale); real content or a clear `[NEED: …]` marker, never
invented facts, logos or numbers; no emoji as icons; every list and table has empty, loading and error
states.

## Credits
The section screenshot script (`shoot.mjs`), the copy tells, the type pairings and the palettes come
from tasteskill by [Leonxlnx](https://github.com/Leonxlnx/taste-skill) (MIT), vendored unchanged at
commit `f6b7657`; see `<skill>/vendor/taste-skill/NOTICE.md`. Several rules in `guides/anti-slop.md` are adapted from it.
