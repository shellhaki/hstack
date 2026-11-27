---
name: hstack-motion-hyper
description: "The hyper-motion language: beat-locked kinetic graphics for teasers and launches. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Hyper motion

A motion language for short, loud pieces: 80% graphic design in motion, 20% product. Every element
moves fast and snaps hard on the beat. Use it for teasers (10–25 s), launch stingers, social cut-downs
and the opening seconds of a longer film. Don't use it for explainers or anything people need to read
slowly: hyper trades understanding for energy.

## The beat rules everything
1. **Pick the track first** and find its tempo. Put it in `src/beat.ts` (`BPM`, `OFFSET` = first
   downbeat). Every cut, slam and hit is on `beat(n)`; nothing lands between beats unless it's a
   deliberate off-beat accent.
2. **One cut per beat or two** in the busy parts; hold 2–4 beats on the moments that must be read.
3. **Plan a peak** about 75–85% of the way in: the biggest shot, the loudest hit, then a beat of near
   silence, then the logo stinger.
4. **Exact cut count:** decide it in the storyboard (e.g. 13 cuts for 15 s) and keep to it.

## Cut grammar
- **Every cut must be compositionally different** from the one before: change at least two of scale
  (huge type ↔ small detail), color field, layout (full frame ↔ split screen ↔ panel) and direction
  of motion.
- **Type is readable before anything overlaps it.** Hold a word at least 6–8 frames clean at 60 fps.
- **Graphic matches:** end a cut on a shape that the next cut starts from (a letter becomes a stamp,
  a circle becomes a lens, a bar becomes a wipe).
- **Foreground wipes:** something large crosses the lens to hide the cut (a panel, a card, the
  product's own element).

## The vocabulary (build each once in `motion.ts` / `kit.tsx`, reuse)
| Effect | How | Sound |
|---|---|---|
| Slam | a word or shape scales from 1.3 to 1 in 3–4 frames with a 2–3 px camera shake | sub hit + transient |
| Shutter flash | one or two frames of white (or the accent) between cuts | soft click or air |
| RGB split | offset red/blue copies of the layer by 4–12 px for 2–4 frames | glitch tick |
| Speed lines | thin lines streaking in the motion's direction for 6–10 frames | whoosh |
| Split screen | 2–3 flat color panels, each with a different freeze of the subject | one hit per panel |
| Stamp / target lock | a ring snaps around the subject with UI brackets and ticks | lock beep |
| Type barrage | one word per beat, full frame, each a different color field | slam per word |
| Rotating type ring | text set on a circle turning around the subject, letters scatter on exit | swirl |
| Shatter panes | flat color panes break away one by one revealing the next | glass shard |
| Speed ramp | slow a move to 30% at its key pose for 6–10 frames, then snap back | tape-stop / reverse swell |
| Overexpose | the peak shot blooms to white for 4–8 frames | riser into impact |
| Textures | checker tiles, halftone dots, city or blueprint grids, UI ticks, barcodes | — |

## Consistency (character lock)
If a character or mascot appears, it is locked: the same shape, colors, proportions and features in
every frame. Write its spec once in the storyboard under CAST and build it as one component
(`src/cast.tsx` in the kit is a starting point); never redraw it per scene.

## Sound for hyper
Drum-heavy electronic (future bass, breakbeat, trap-leaning) with risers before drops, a sub hit on
every cut, glitch fills, and sound design on every graphic action (slams, swipes, shatters, ticks).
Master it loud (`guides/sound/SKILL.md`, about -10 LUFS short-term at the peak). End on a cold logo
stinger: one hit, a tail, silence.

## Review additions
On the contact sheet, every two neighbouring cuts must differ in at least two ways; every word must be
readable in some frame; the peak must be the biggest frame in the sheet.
