---
name: hstack-ui-design-principles
description: "Design principles (compiled). Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Design principles (compiled)

This is the design instruction the worker follows to write a project's `DESIGN.md`. It was compiled by
a frontier model from nine products with excellent interfaces: Linear, Vercel, Stripe, Raycast,
Resend, Figma, Notion, Supabase and Brimble (measured 2026-11-25: computed fonts, sizes, colors, radii
and widths, plus full-page captures).

It does **not** give you a font, a color or a layout to copy. It tells you **how to choose** them for
the product in front of you, and **what never to choose**. The site notes at the end show what each
site does well; they are evidence for the rules, never a template. A page that looks like one of
them has failed.

## 0. Start from the product, not from a look
Write these four lines first, from the brief. Every later choice must follow from them.
1. **Trade and audience:** who uses it, and what they come to do (for example "developers deploying
   apps", "parents booking swim lessons").
2. **Three mood words**, concrete and different from each other: "precise, calm, fast", "warm,
   editorial, trustworthy", "bold, playful, loud". Not "modern" or "clean"; every site is that.
3. **The product's own material:** what the product actually shows or makes (a dashboard, a waveform,
   a document, logs, a map, a photo, a receipt). That material becomes the imagery and the signature.
4. **Light or dark first:** dark when the audience lives in dark tools (developers, creative pros,
   night use); light for everyone else and for anything with photos, documents or long reading. Build
   both only if the brief asks.

## 1. Type: one display face with character, one quiet text face
What all nine do: the **display face carries the personality**; body text is a quiet, very readable
sans. Headlines are **not bold**: display weights are 300 to 510 (Stripe 300, Figma 400, Vercel 400,
Resend 400, Brimble 500, Notion 500, Linear 510). Large headlines have **negative tracking** (from
-1% at 40px to -6% at 64px+). Weight contrast comes from size, not from 700 or 800.

How to choose:
- Pick a pairing by `id` from `<skill>/vendor/taste-skill/type.json` whose `kinds` and `moods` match
  the lines in step 0. Explain the match in one line.
- **A serif display face over a sans text face** is the strongest way to look human and premium
  (Brimble: Lora over IBM Plex Sans; Resend: Domaine over Inter). Choose it for warm, editorial,
  trustworthy or crafted moods. Use a **sans display face** for precise, technical or fast moods.
- **One family is fine** when it has a good variable weight axis (Linear: Inter at 510 and 590; Vercel:
  Geist at 400 and 450). Two families is the maximum, plus a mono for real code.
- Display weight: 400 to 500 (300 only for a light, airy mood). Text weight: 400, with 500 for UI
  labels and buttons.
- Sizes at 1440 wide: hero 56 to 80, section heading 32 to 48, card title 18 to 20, body 15 to 18,
  UI and nav 13 to 14. Hero is about 4 times the body size. Line height: 1.0 to 1.1 for display,
  1.5 to 1.6 for body.
- **Two-tone headings** are allowed and work well: the first sentence in the text color, the
  continuation in the muted color (Linear, Stripe, Figma, Supabase). Use it on section intros, not
  everywhere.

Never:
- **Monospace for anything except real code, terminal output, logs, IDs and numbers in tables.** No mono
  labels, status lines, captions, nav, buttons, headings or "technical-looking" decoration. Every one
  of the nine uses mono only inside code blocks and logs. Mono UI text is the most common AI tell and
  the user has rejected it.
- Small uppercase letter-spaced eyebrows above headings, numbered kickers ("01 —"), fake codes.
- Bold (700+) display headlines, all-caps headlines, or a third font for flavour.
- The fonts that read as "AI default" when nothing was chosen: Space Grotesk, Space Mono, JetBrains
  Mono or IBM Plex Mono as UI text, Poppins, Montserrat, Inter at 700 for headlines. Inter or Geist as
  a *text* face is fine.
- A reference's display face (Söhne, Domaine, Die Grotesk, figmaSans, ABC Favorit are also licensed).

## 2. Color: neutrals do the work, the accent is rare
What all nine do: 90% or more of every screen is neutrals. The **primary button is usually the
text color inverted** (white on a dark page, black on a light page: Linear, Vercel, Raycast, Notion,
Figma, Resend, Brimble). Only Stripe and Supabase make the primary button the brand color. The brand
hue appears in one or two places per screen: a highlight word, one illustration, a status dot, a
chart line.

How to choose:
- Follow `guides/color/SKILL.md` for the source (a `palettes.json` id, a tweakcn theme, or a scheme from one
  accent) and the contrast check.
- Decide **neutral-first**: background, surface, border, text and muted text. Tint the neutrals a
  little toward the accent hue, never pure grey next to a colored accent.
- Dark pages: background near black (lightness 3 to 8%), surfaces lifted 3 to 6% with hairline borders
  at about 8% white. Light pages: white or a warm off-white, sections may alternate between two
  neutrals (Brimble, Notion).
- **Choose the primary button:** inverted neutral by default. Use the accent for it only when the
  brand color is part of how people recognise the product, and then keep the accent off everything
  else on that screen.
- Pick the accent hue from the product (green for growth or money, a warm hue for people and food,
  blue for trust) and make it differ from every site in section 8 used as an accent there.
- Secondary text is the muted color, not a smaller size: 60% to 65% contrast of the text color, and
  still 4.5:1 against the background.

Never: purple-to-indigo gradients, neon glows, glass panels, gradient text on more than one word,
more than one accent hue for decoration, or a color with no role in `DESIGN.md`.

## 3. Layout: one width, generous air, left-aligned structure
What all nine do: one page width (about 1100 to 1340 px), large vertical gaps between sections
(96 to 160 px), and **left-aligned section headings with the explanation to the right or below**
(Linear, Vercel, Stripe, Supabase, Raycast). Centered layouts appear only for the hero and the final
call to action (Notion, Resend, Brimble).

How to choose:
- Page width: 1120 to 1280; text blocks max about 640 (60 to 75 characters).
- Section padding: 96 to 128 on desktop, 64 on phone. More air for calm moods, less for dense tools.
- Pick **one** section pattern and repeat it: heading left + text right, or heading above + product
  view below. Break it at most twice per page, on purpose.
- Feature lists: a grid of 3 or 4 columns separated by **hairline borders**, each item with a small
  icon, a 14 to 16 px title and two lines of muted text (Brimble, Resend, Stripe). This is the only
  allowed text-only grid, and only after the main features have been shown as product (section 4).
- Footer: a dense multi-column link grid in small muted text. It is quiet, never a second hero.

## 4. Imagery: show the real product, plus one piece of brand art
What all nine do: the **hero image is the product itself**: a real app window, editor, dashboard,
log or chat (Linear, Notion, Vercel, Supabase, Resend, Brimble, Raycast). Features are shown as small
working pieces of the product, not described in boxes. Each site adds **one** recognisable piece of
art that belongs only to it: Brimble's engraved bee, Stripe's ribbon gradients, Raycast's red stripes,
Resend's black 3D cube, Vercel's lit triangle, Figma's community collage.

How to choose:
- Hero: the product's main screen, built from the same registry components the app uses, with real
  sample data from the brief. A product without a screen yet: its material from step 0 (a waveform,
  a receipt, a map), or `[NEED: product screenshot]`.
- Brand art: **one** motif from the product's material or name, used in the hero and echoed once at
  the end of the page. It comes from the user's assets or a motion registry background
  (`guides/motion/SKILL.md`). Never stock 3D shapes, never a reference's motif.
- Customer logos and testimonials only from the user (`guides/icons/SKILL.md`).

Never: a fake terminal that types itself (a blinking cursor printing commands in a loop) or any
typewriter animation. A terminal or code block appears only when the product really is used from a
terminal or code, shows the real commands, and is static (Brimble, Resend, Supabase show it static).
Never grids of grey boxes pretending to be UI, floating badges around the hero, or emoji.

## 5. Components: small, quiet controls
What all nine do: buttons are small (text 13 to 14 px, height 32 to 40), with one radius family:
either 6 to 8 px (Vercel, Figma, Raycast, Brimble, Supabase) or full pills (Linear, Notion). Cards
use a hairline border or a slightly lifted surface, rarely a shadow. Radii grow with size: about
8 px for controls, 12 to 16 px for cards, 20 to 24 px for large media.

How to choose: one radius family that matches the mood (pills for friendly and soft, 6 to 8 px for
precise and technical, 2 to 4 px for serious finance or editorial), borders over shadows on dark
pages, and at most one soft shadow on light pages. Everything comes from the registry
(`guides/components/SKILL.md`).

## 6. Motion: calm, purposeful, finished in under 400 ms
What all nine do: very little moves. Product views fade or slide in once as they enter the screen,
hover states are quick (150 to 200 ms), and the one piece of brand art may move slowly. Nothing
loops for attention near text.

How to choose: entrance once per section, 200 to 400 ms, ease-out; hover 150 ms; the background
named in `DESIGN.md` slow and low contrast; smooth scrolling only by `guides/scroll/SKILL.md`. Everything
honours reduced motion.

Never: typing effects, counters that spin up, marquee text, cursor trails, parallax on text, or
more than one moving element in view.

## 7. Copy: short, plain, specific
What all nine do: hero headlines of 3 to 8 words that state the product plainly ("Email for
developers", "The cloud for AI agents", "Agentic Infrastructure"), and one sentence below. Section
headings name a benefit in 2 to 6 words ("Push to deploy.", "Observability, built in"). Check copy
against `<skill>/vendor/taste-skill/copy-tells.md`.

## 8. The nine sites (evidence, never a template)
Use these to understand the rules above. Do not reproduce any site's hero, art, palette, display font
or section order.

| Site | Mood | Learn from it | Its own (never copy) |
|---|---|---|---|
| Linear | precise, dark, fast | Inter 510 headlines with tight tracking, two-tone section intros, product UI as hero, hairline borders | its exact dark product chrome, isometric line drawings |
| Vercel | stark, technical | one face (Geist) at 400 to 450, huge negative tracking, case-study rows: big statement + product shot + small feature list | the lit triangle, pure black with white glow |
| Stripe | bright, confident, finance | light 300-weight headlines, two-tone paragraphs, dense real product cards, stats strip with real numbers | ribbon gradients, Söhne, its purple |
| Raycast | bold, playful, dark | product window as hero, keyboard as imagery from its own material, testimonials as small cards | red diagonal stripes, 3D keyboard |
| Resend | dark, editorial, developer | serif display (Domaine) over Inter, live code examples, 3D icon art per section | black glass cube, its serif |
| Figma | creative, light, loud | community work as imagery, plain black buttons, huge display type with restraint everywhere else | collage hero, figmaSans, its color blocks |
| Notion | friendly, light, calm | centered short hero, black pill buttons, product window on a painted background, customer workspaces | its painted backgrounds, illustrations, Die Grotesk |
| Supabase | developer, dark green | bento grid of products each with a tiny real demo, code tabs per framework, community quotes | its green, its bento layout |
| Brimble | warm, crafted, developer | Lora serif headlines over IBM Plex Sans, engraved illustration as brand art, real logs and UI as feature proof, hairline feature grid, light grey section bands | the engraved bee, its blue CTA band |

## 9. Self-check before writing DESIGN.md
- Every choice traces back to a step 0 line (write the reason in one short clause).
- Fonts, accent and brand art differ from every site above.
- No mono outside code and data, no eyebrows, no bold display, no typing animation, no fake terminal.
- One radius family, one section pattern, one accent, one moving element.
