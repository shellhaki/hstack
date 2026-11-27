---
name: hstack-motion-motion
description: "How things move. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# How things move

Motion is what separates a launch video from a slideshow. The kit supplies the **primitives** (springs,
easing, timing to words, transitions, sound). The scenes are yours: build them for the direction you
chose (`guides/direction/SKILL.md`), not by copying an example.

## The primitives (kit/src/motion.ts)
- `rise(frame, delay, bouncy)`: a spring from 0 to 1. `bouncy` overshoots and settles (elastic
  language); without it, it settles softly.
- `enter(frame, delay)`: out of a slight blur, rising and scaling up. One possible entrance, not the
  only one.
- `pop(frame, delay)`: a bigger bounce from small, with a slight turn.
- `between(frame, start, end, from, to)`: eased movement with no overshoot: camera moves, lines
  drawing, editorial and mechanical languages.
- Everything is timed in frames at 60 fps: `s(seconds)` converts; `at(sceneId, word)` gives the frame
  a word is spoken.

Write new movement when the direction needs it (gravity, a hard snap, a fold, a long camera path):
it's a few lines with `interpolate` and `spring`. Keep each new curve in `motion.ts` so the whole
video shares it.

## The technique library (reference, not a menu)
The kit's example scenes show how to build some techniques. Read one to learn the technique, then build
your own scene for your concept. **Never ship an example scene with its content swapped:** its layout,
copy and order are what made every earlier video look the same.

| Technique | Example to read |
|---|---|
| Typed text with a marker on fresh words | `TypeLine` in `kit.tsx` |
| A huge word hitting the screen | `Slam` in `kit.tsx` |
| Letters spinning on slot reels | `SlotWord` in `kit.tsx` |
| A word rolling up out of a mask | `Words` in `scenes/examples.tsx` |
| Many copies on a tilted 3D plane, camera pulling back | `Copies` in `scenes/patterns.tsx` |
| Cards falling in with 3D tilt; a glitch | `Cards` in `scenes/patterns.tsx`, `Glitchy` |
| Text scrambling into ciphertext and collapsing | `Encrypt` in `scenes/patterns.tsx` |
| Items placed on a path and connected | `Nodes` in `scenes/examples.tsx` |
| Bars growing with a counter | `Bars` in `scenes/examples.tsx` |
| Messages arriving in windows | `Chats` in `scenes/patterns.tsx` |
| A product window in 3D with a light sweep | `Product` in `scenes/patterns.tsx` |

Preview them with the `Gallery` composition. Before writing a new piece, check whether a free snapcn
component already does it well (`guides/components/SKILL.md`): screens and devices, cursors, AI
prompts, captions, logo reveals.

Techniques that make a product film feel organic (build them for your concept; none is in the kit):
- **Ghost word depth:** a huge word, blurred and faint, behind the small sharp line that says it.
- **Focus pull:** many small elements (logos, files, messages) drifting at different depths, the far
  ones blurred, converging into one sharp thing.
- **Cursor-driven story:** a cursor hovers, clicks and drags through the real UI; buttons press in and
  morph (a send button becomes the next state).
- **Type into the frame:** a prompt typed huge across the screen, then shrinking into the input it
  belongs to.
- **Working state:** a shimmer passing over "Working…" or a progress line, held just long enough.
- **Proof beat:** one number against a bar or a before/after, counted up on the beat.
- **Dolly into the UI:** the camera moves into a panel of the real app, the rest falling out of focus.
Hyper-language techniques are in `guides/hyper/SKILL.md`. Techniques that fit other concepts and are not in the kit
(build them): a camera traveling across one large canvas, paper pinning and folding, a grid filling
cell by cell, a map zooming to a place, a cursor driving the real UI, a split screen, type set along
a path, a counter that becomes a chart.

## Rules
1. **One motion language** for the whole video, chosen in the direction.
2. **Nothing appears without motion,** and nothing hard-cuts unless the language is mechanical and
   the cut is on a beat.
3. **Stagger siblings** (4–8 frames), never all at once.
4. **Land on the word.** Anything the voice names appears on that word (`at(id, word)`), a few frames
   early.
5. **Keep the camera alive:** a push, a pan or a drift in every shot, never a dead still frame.
6. **Fill the frame.** Headlines at least a third of the frame's height when they are the subject; UI
   cropped and scaled 2–3× so text reads on a phone; no shot that is mostly empty background.
7. **Real content only:** real commands and output, the app's real screens rebuilt from its own CSS.
   Terminals fill from the top down, like real ones.
8. **One idea per shot**; at most two lines of text on screen at once.
