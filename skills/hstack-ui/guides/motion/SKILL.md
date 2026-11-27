---
name: hstack-ui-motion
description: "Motion and animated backgrounds. Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Motion and animated backgrounds

Motion brings a page to life when it is chosen once, in `DESIGN.md`, and used with restraint. Like
components, animations come from registries, never hand-written from memory.

## Sources (shadcn registries, same CLI as `guides/components/SKILL.md`)
| Registry | Good for | Find with |
|---|---|---|
| `@react-bits` | animated backgrounds (aurora, silk, threads, particles, waves), text effects | `npx shadcn@latest search @react-bits -q "<effect>"` |
| `@magicui` | quiet SVG backgrounds (dot, grid, flickering grid, striped, hexagon), shine borders | `npx shadcn@latest search @magicui -q background` |
| `@aceternity` | background beams, lines, dots, noise, stars, aurora; whole sections with a background | `npx shadcn@latest search @aceternity -q background` |
| `@motion-primitives`, `@animate-ui` | enter, scroll and hover animations for content | `npx shadcn@latest search @motion-primitives -q "<what>"` |

React Bits items come in four variants: pick `-TS-TW` (TypeScript + Tailwind), for example
`npx shadcn@latest add @react-bits/Aurora-TS-TW`. For animation code of your own (enter, layout,
gesture), use the `motion` package (`import { motion } from "motion/react"`), never CSS keyframes
invented per component.

## Choose the background in DESIGN.md first
The worker proposes **one** background for the project in `DESIGN.md` (Motion section): the registry
item, where it appears, its colors, speed and opacity. The frontier approves it with the rest of the
system. Pick by the product, not by what looks impressive:
- It should say something about the product: a waveform or flowing lines for audio, a grid or dots
  for a developer tool, soft particles for something ambient. Write the reason in one line.
- Quiet SVG patterns (`dot-pattern`, `grid-pattern`) suit dense apps and docs; WebGL ones (aurora,
  silk, threads, dither) suit a hero only.
- Never the brand art of a site in `guides/design-principles/SKILL.md` section 8, and never a typing
  terminal or typewriter effect.

## Rules
1. **One animated background per page**, behind the hero or one feature band, never behind body
   text or a whole long page.
2. **Colors from the theme:** pass `DESIGN.md`'s accent and surface colors (CSS variables), never
   the component's default palette.
3. **Readable on top:** text over it keeps at least 4.5:1 contrast. Lower the effect's opacity or
   add a scrim from the theme; never dim the text instead.
4. **Slow and calm:** motion that loops runs slowly; nothing flashes more than 3 times a second.
5. **Reduced motion:** with `prefers-reduced-motion: reduce`, show a still frame or the static
   version (`useReducedMotion()` from `motion/react`, or a media query).
6. **Cost:** WebGL and canvas backgrounds pause when off screen or in a hidden tab, and are lazy
   loaded below the fold. On phone, use the static version if it drops frames.
7. **Content motion:** enter animations at most once per element, short (the `DESIGN.md` duration),
   and never block reading or clicking. Hover and press feedback come from the component's own states.
8. **Purpose:** every animation either shows the product working, guides the eye to the primary
   action, or confirms an action. Decoration that does none of these is cut.

## Check
In the screenshots: text over the background is readable, and the page still reads well as a still
image. In the browser: the background pauses off screen, and reduced motion turns it off.
