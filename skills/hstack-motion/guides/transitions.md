# Transitions

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
