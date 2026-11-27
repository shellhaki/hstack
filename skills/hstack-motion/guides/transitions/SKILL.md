---
name: hstack-motion-transitions
description: "Transitions. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Transitions

## First choice: one element becomes the next screen
The best handover is no transition at all: **an element of this scene turns into the next scene.**
A dot grows into a lock; the lock fills the frame and becomes the next color field; a word shrinks
into the terminal it names; a ✓ swells into the shape the next scene is made of; a log line's
underline shoots out and becomes a bar, then a shockwave. The viewer's eye follows the element, so
the cut never registers as a cut.

Plan it in the storyboard: every row's "Into this scene" column says **"X becomes Y"**. To build one:
1. Pick the element on screen at the end of the scene that best matches a shape in the next one.
2. Over 0.4–1 beat, animate its position, size, radius and color to the next scene's shape
   (`lerp` with an ease), while everything else in the old scene fades or flies away.
3. The next scene starts *as* that shape, then reveals its own content.

Use the stock transitions below only when no element can carry over, and say why in the storyboard.
Never use a plain crossfade, camera shake, a white or color flash, or a glitch as a transition.

## Stock transitions (fallback)

The direction's motion language decides how scenes hand over: a continuous-camera video has no
transitions, only camera moves; an editorial one uses few and slow ones; a mechanical one may cut
hard on a beat. When scenes do hand over, the kit's four are a starting point.

Scenes never plain-fade. Each one hands over to the next with a camera move and a
sound under it. The kit has four, in `kit/src/transitions.tsx`, used through Remotion's
`TransitionSeries` with a spring timing of about 20 frames (a third of a second).

| Transition | What it does | Sound under it | Use between |
|---|---|---|---|
| `through()` | the camera pushes forward through one scene into the next (scale and blur) | `whoosh` | related scenes, a calm continuation |
| `whip()` | a fast pan sideways with motion blur | `swipe` | a change of topic |
| `reel()` | the next scene rolls up like a slot-machine reel | `slot` | lists, comparisons, a punchline |
| `iris()` | the next scene opens out of a growing circle with a ring of the brand color | `shimmer` | a reveal: the fix, the logo |

Rules:
- Mix them; never the same transition three times in a row.
- The scene on each side keeps moving during the transition (its own springs keep running).
- Each scene is as long as its line plus the overlap, so the voice never overlaps another line:
  the kit's `script.ts` handles this (`TRANSITION`).
- The last scene fades to the background color; it doesn't transition to nothing.
