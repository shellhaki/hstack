---
name: hstack-ui-anti-slop
description: "Anti-slop rules. Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Anti-slop rules

Banned defaults: each is what a model produces when nothing tells it otherwise. Rules marked (taste)
are adapted from tasteskill by [Leonxlnx](https://github.com/Leonxlnx/taste-skill).

## System
- One system per project: one spacing scale, one type scale, one radius family, one button shape,
  one card recipe, one border style (taste). Never add a second.
- Only values from `DESIGN.md`. No arbitrary Tailwind values (`p-[13px]`, `text-[#7c3aed]`).
- No default purple or indigo gradients, no glassmorphism, no glow, unless `DESIGN.md` names them.
- No emoji as icons or bullets; one icon set, one stroke width.
- No hand-built components: install them from the registry (`guides/components/SKILL.md`).

## Type
- **Monospace only for real code and real data:** code, IDs a user copies, timestamps and numbers in
  tables. Never for headings, labels, status messages, buttons or decoration.
- **No kicker labels as a pattern:** no numbered eyebrows ("01 —", "STEP 02"), no fake codes
  ("TK-01 · SAMPLE"), no small uppercase letter-spaced text above every heading. At most one eyebrow
  per page, in sentence case, and only when it adds information the heading lacks.
- Uppercase is for short UI labels the design system names (a badge, a table header), not for copy.
- Status and helper text use the body font at the muted color, in sentence case.
- One display face and one text face (they may be the same family); no third font for "flavour".

## Layout
- Equal left and right edges on every section; one content width (taste).
- Not everything centered: centered only for a short hero or a single call to action.
- One primary action per view. Secondary actions are visually quieter.
- Every page works at 390px wide with no horizontal scroll.

## Show, don't tell
- **No grids of static text boxes** (title plus description) to explain features or steps. Each box is
  the feature working: a small interactive demo with sample data, built from registry components.
  For example: grammar correction as a before/after toggle on a real sentence; filler removal as a
  transcript where the fillers strike through; pacing as a live slider over a waveform; voices as a
  toggle group that changes a preview; take comparison as tabs between two takes.
- **Steps sections:** not numbered text boxes. One interactive walkthrough (tabs, a stepper or a
  segmented control) where choosing a step changes a single preview of the product.
- A text-only card is allowed only for content that has nothing to show (a quote, a legal note).

## Motion and imagery
- One animated background per page, from a motion registry, named in `DESIGN.md`, in theme colors
  (`guides/motion/SKILL.md`). Not a stack of effects, not behind body text, never without a reduced-motion
  fallback.
- Icons from the one library `DESIGN.md` names; logos from svgl, Simple Icons or the brand
  (`guides/icons/SKILL.md`). Never a hand-drawn SVG icon or logo, never a "Trusted by" row of logos the
  user didn't give as real customers.

## Content
- Real copy from the brief, or `[NEED: what]`. Never lorem ipsum, invented customers, logos,
  testimonials or figures.
- Check copy against `<skill>/vendor/taste-skill/copy-tells.md` (banned words, stock lines, stat strips,
  "X. Y." headings).
- No fake product UI made of grey boxes: use the real product screen, or leave the slot marked.

## States
- Every list, table and data view has empty, loading and error states.
- Every interactive element has hover, focus-visible and disabled states; focus is never removed.
- Text contrast at least 4.5:1 (3:1 for large text).
