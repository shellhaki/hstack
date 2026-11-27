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
- **The only transition is a morph:** one element of this shot becomes the next shot (a stamp becomes
  a lock, a lock fills the frame as the next field, a word rolls letter by letter into the next word,
  a ✓ swells into the next layout, a line becomes a bar). See `guides/transitions/SKILL.md`.
- **Banned as transitions:** camera shake, white or color flashes, RGB-split glitches, hard cuts
  between unrelated shots. They read as cheap. Don't use shake or flashes at all unless the user asks.

## The vocabulary (build each once in `motion.ts` / `kit.tsx`, reuse)
| Effect | How | Sound |
|---|---|---|
| Settle | a word or shape rises and scales from 1.08 to 1 over 12–18 frames with a soft spring | soft tick |
| Speed lines | thin lines streaking in the motion's direction for 6–10 frames | whoosh |
| Split screen | 2–3 flat color panels, each with a different freeze of the subject | one hit per panel |
| Stamp / target lock | a ring snaps around the subject with UI brackets and ticks | lock beep |
| Type barrage | one word per beat, full frame, each a different color field | slam per word |
| Rotating type ring | text set on a circle turning around the subject, letters scatter on exit | swirl |
| Shatter panes | flat color panes break away one by one revealing the next | glass shard |
| Speed ramp | slow a move to 30% at its key pose for 6–10 frames, then snap back | tape-stop / reverse swell |
| Overexpose | the peak shot blooms to white for 4–8 frames | riser into impact |
| Textures | only if the user asks: halftone, checker tiles, UI ticks. **Never a grid** (dot, line or blueprint) unless the user explicitly asks for one | — |

## Cool, not violent
"Hyper" means energy and rhythm, not noise. The target is cool, smooth and easy on the eye: the
viewer should feel the beat, not get hit by it.
- **Stay in the brand's palette.** Its background, its one accent, and greys. No extra bright fields
  (green, red, white) that the product doesn't use; status colors only as small details.
- **No decorative marks.** No corner labels, timecodes, beat counters, barcodes or registration
  marks unless the brand itself uses them. They read as bloat.
- **Smooth motion.** Eased moves of 12–30 frames and soft springs; slams are rare (one or two per film)
  and still eased. Energy comes from the morph chain and the cutting rhythm, not from impact.
- **Calm frames, strong composition:** dark field, one big subject, generous space, one accent. Scale
  contrast (big type with a small label) and an off-center layout still matter; texture is optional
  and subtle (a soft gradient at most). **No grids, ever,** unless the user explicitly asks.
- **Sound:** soft transients (ticks, blips, swooshes) on most actions; a deep hit only at the one or
  two moments that matter. Not an impact on every beat.

## Things that make a hyper frame ugly (never ship these)
- **A line crossing through text.** Rings, rules and shapes must clear type by at least 40 px, or the
  type sits on its own solid plate in front of them. Check the widest word against the shape's size.
- **A fake glyph part.** A circle standing in for a period, a box for an "i" dot: it never matches the
  font's baseline, size and spacing. Use the real glyph, or make the shape clearly its own element
  (a stamp, a seal) that doesn't pretend to be part of the word.
- **Half-faded type lingering.** Letters at 40–90% opacity for more than 3–4 frames read as mistakes.
  Type is either in, or moving fast.
- **Empty frames:** more than half the frame flat and unused, with nothing to anchor the eye.
- **A shape over type at the peak:** shockwave rings, bursts or rules drawn across the hero word.
  The hero word owns the frame; effects go behind a solid plate or stay clear of it.
- **Mismatched families:** mono and sans mixed inside one word, or one-off sizes that aren't on the
  type scale.

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
