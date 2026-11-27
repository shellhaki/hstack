---
name: hstack-ui-writing-design-md
description: "Writing DESIGN.md (worker). Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Writing DESIGN.md (worker)

You write `.hstack/ui/DESIGN.md` from two inputs: the brief and `guides/design-principles/SKILL.md`, using
the template in `templates/design-system.md`. The principles were compiled for you from nine strong
products. They tell you how to choose, not what to copy. The frontier reviews the text, so every
line must be checkable.

## Steps
1. **Product lines.** Write step 0 of `guides/design-principles/SKILL.md`: trade and audience, three mood
   words, the product's own material, light or dark first.
2. **Choices.** Go through sections 1 to 7 of the principles in order. For each one, write the
   choice and one short clause saying which product line it follows from:
   - **Fonts:** a pairing by `id` from `<skill>/vendor/taste-skill/type.json`. Mono only for code
     and data.
   - **Palette:** from a source in `guides/color/SKILL.md`, neutral-first, with the primary-button rule
     from section 2.
   - **Layout:** page width, section padding, the one section pattern.
   - **Imagery:** what the hero shows, and the one brand-art motif.
   - **Components:** the radius family and borders or shadow.
   - **Motion:** what moves; the background from `guides/motion/SKILL.md` (or none); Lenis or native
     scrolling (`guides/scroll/SKILL.md`); the icon library (`guides/icons/SKILL.md`).
3. **Values.** Turn the choices into tokens, snapped to the scales below.
4. **Signature.** Write 2 to 4 concrete moves that come from the product's material. For example:
   "the waveform is the hero image, drawn in the accent color", or "pricing shows minutes of audio,
   not credits". A signature is never a type trick, and never a move from the site table in the
   principles (section 8).

## A site the user names
If the user names a site they like ("like brimble.io"), capture it as `SKILL.md` step 2 describes.
Open its hero tile and one content tile, and add a `From <site>:` line listing the principles you
take from it. Don't list the values. If the user wants to keep their own existing UI, that UI is the
reference, and matching it is the goal.

## Scales (snap every value)
- Spacing: 4 8 12 16 24 32 48 64 96 128.
- Radius: 0 2 4 6 8 12 16 24, or full.
- Font sizes: 12 13 14 15 16 18 20 24 30 36 48 56 64 72 80.

## Fill what the project needs
Write the shells and components this project will build. For example, an online shop needs a
product grid, product page, cart, checkout and account pages. Derive each one from your choices.
Name the registry block or component each one uses (`guides/components/SKILL.md`).

## Self-check before handing it to the frontier
- Every token has a value. No adjectives without numbers. No near-duplicates, such as 14 and 15,
  or #111 and #121.
- `guides/design-principles/SKILL.md` section 9 passes.
- Contrast passes: text on background, and primary text on primary, at least 4.5:1.
- Anything you don't know is marked `[ASK]`, never a guess.
- It fits on about two screens.

Then send the frontier the file.
