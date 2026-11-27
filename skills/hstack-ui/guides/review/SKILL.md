---
name: hstack-ui-review
description: "Review checklist (frontier). Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Review checklist (frontier)

Open the worker's `.hstack/ui/screens/<page>/` tiles, with `DESIGN.md` and `guides/design-principles/SKILL.md` at hand. Check, in
order, and stop at the first category that fails: send one correction with file, element and the
expected value.

1. **System:** colors, fonts, sizes, radii and borders all come from `DESIGN.md`. No stray values.
2. **Layout:** equal edges, one content width, consistent section rhythm, alignment on a shared grid.
3. **Hierarchy:** one obvious primary action per view; headings read in a clear order.
4. **Phone (390px):** no horizontal scroll, nothing clipped, tap targets at least 44px, text not tiny.
5. **States:** empty, loading and error exist where data appears; focus is visible.
6. **Content and type:** no invented facts, no lorem ipsum, no copy tells
   (`<skill>/vendor/taste-skill/copy-tells.md`), no monospace or uppercase-tracked kicker labels
   outside real code and data (`guides/anti-slop/SKILL.md`, Type).
7. **Not a clone, not generic:** no page may read as one of the sites in `guides/design-principles/SKILL.md`
   section 8 (or a site the user named): its hero layout, its colors, its display font, its brand art.
   And no page may read as an AI default (mono UI text, eyebrows, bold display, typing terminal,
   purple gradient). Send it back with the exact element to change.
8. **Show, don't tell:** no grid of static text boxes for features or steps; each one is interactive.
9. **Prebuilt parts:** run `node <skill>/tools/check-prebuilt.mjs .` yourself; it must print `ok`.
   Then spot-check one page for look-alikes it can't see (a styled `div` acting as a card or badge).
10. **Motion and icons:** only the background `DESIGN.md` names, readable text over it, a reduced-motion
    fallback; Lenis only where `DESIGN.md` says, with inner scroll areas still native; `tools/contrast.mjs`
    exits 0; one icon library, no emoji icons, no drawn logos, no customer logos the user didn't give
    (`guides/motion/SKILL.md`, `guides/scroll/SKILL.md`, `guides/color/SKILL.md`, `guides/icons/SKILL.md`).

Approve when all 10 pass. Do not ask for polish beyond `DESIGN.md`; change `DESIGN.md`
instead if the system itself is wrong.
