---
name: hstack-motion
description: Motion-graphics videos under hstack. Use only when the user invokes /hstack-motion to make a promo, launch, teaser, explainer or product video (YouTube, social, landing-page hero) from a prompt or from a codebase. The worker writes a storyboard and script first, picks one of three creative directions drawn from the product's own world, writes a storyboard, builds original scenes in Remotion on a kit of primitives (springs, transitions, voice and sound timed to words), and the frontier reviews stills before anything is rendered in full.
purpose: Launch-quality motion graphics from a small model that look like this product and no other, with no slideshow fades, no robotic voice and no invented claims.
author: shellhaki
version: 0.2.0
disable-model-invocation: true
---

# hstack-motion

**Two ways to run this skill.**
- **Alone (`/hstack`, or no hstack mode at all):** you do every step yourself. Where a step says "the
  worker", that is you. Where it says "the frontier reviews", review your own contact sheet
  against `guides/review.md` and fix what fails; ask the user to pick the direction and approve the
  storyboard, since every scene depends on them.
- **Team (`/hstack-team`):** if it isn't on yet, do its "Turning it on" steps to pick the worker, then
  follow the steps as written. The brief, review and token rules of `hstack-team` apply.

A video here is code: a [Remotion](https://remotion.dev) project (React, rendered frame by frame to MP4).
Every video must look like its product and no other. The worker invents the **direction** (concept,
look, motion, structure) from the product's own world, and never invents a **fact**: every claim,
number, screen and command is real, and anything missing is a `[NEED: …]`.

1. `.hstack/motion/STORYBOARD.md`: the approved direction and the scenes.
2. The product itself: its real UI tokens, copy, commands, output and prices
   (`guides/from-codebase.md`), or the user's prompt when there is no codebase.
3. The kit in `<skill>/kit/`: **primitives** (springs, easing, timing to words, transitions, sound,
   stills) and example scenes that teach techniques. The examples are for reading, never for shipping
   with new content.
4. The guides: `guides/direction.md` (choosing the direction, and the defaults to avoid),
   `guides/story.md`, `guides/motion.md`, `guides/transitions.md`, `guides/voice.md`,
   `guides/sound.md`.

## Files in the user's project
```
video/                    the Remotion project (copied from <skill>/kit)
.hstack/motion/
  STORYBOARD.md           the story; every later change reads this first
  stills/                 frames the worker rendered for review
```

## The loop

Steps 1 and 2 are **gates**: no scene is built until the storyboard is approved.

**0. Is there an approved `.hstack/motion/STORYBOARD.md`?** Yes: skip to step 3.

**1. Facts first.** From a codebase, the worker collects what the video may say, following
`guides/from-codebase.md`: product name and one-line pitch, the real UI (colors, fonts, the app's
own components), real commands and what they print, real prices from the code, and the domain.
From a prompt, the same list from the prompt, with every gap as `[NEED: …]`. Prices or claims about
competitors are checked on the competitors' own sites and footnoted with the date; never from memory.

**2. Direction (the most important review).** The worker fills the header and DIRECTIONS of
`templates/storyboard.md` following `guides/direction.md`: three directions that differ in concept and
structure, a recommendation, and the check against the defaults list. The frontier picks one, or
asks for new ones if any is close to the kit's sample video or to an earlier video. Then the worker
fills the scenes for the chosen direction (`guides/story.md`, `guides/motion.md`), and the frontier
approves them or sends exact fixes.

**3. Set up.** Copy `<skill>/kit` to `video/`, rename its `gitignore` to `.gitignore`, `bun install`
(Remotion needs ffmpeg on PATH for the voice tempo step), set the brand tokens and the stage
from the direction in `video/src/theme.ts`, and put the logo in `video/public/`. Write the script lines from the
storyboard into `video/src/script.ts`.

**4. Voice and sound.** With an ElevenLabs key in `video/.env` (`ELEVENLABS_API_KEY=…`), run
`bun run voice` and `bun run sfx` (`guides/voice.md`, `guides/sound.md`). The voice writes the time
of every word, so scenes last as long as their line and motion lands on words (`at(id, word)`).
Without a key, timings are estimated from the text and the video still renders silent.

**5. Build scenes** in `video/src/scenes/`, one component per storyboard row, written for the
direction. Once you have read what you need, delete `scenes/examples.tsx` and `scenes/patterns.tsx` from
`video/`, with their imports and the `Gallery` composition in `Root.tsx`: they must not be in the
final video. Register the scenes in `video/src/Video.tsx` with the
transitions the storyboard names. Colors, fonts and curves live in `theme.ts` and `motion.ts`; add new
ones there when the direction needs them.

**6. Verify.** `bunx tsc --noEmit` passes. Then render stills, not the video:
`bash <skill>/tools/stills.sh video <composition> <frame> <frame> …` writes one contact sheet to
`.hstack/motion/stills/sheet.png`. Pick frames mid-animation and mid-transition as well as at rest.
Read the sheet against `guides/review.md` before asking for review.

**7. Review (frontier).** Review the contact sheet and the storyboard together with
`guides/review.md`. One correction round with exact fixes (scene, element, expected value).

**8. Render.** `bunx remotion render <composition> out/<name>.mp4` (1080p60). For the final upload,
`--scale=2` for 4K. Always render a version without the voice as well (`<composition>NoVoice`), so
the user can choose. Report the files, lengths and anything to check before publishing (prices, music
rights).

## Not hstack-ui
This skill runs only when the user invokes `/hstack-motion`. A video is not an interface: the
`hstack-ui` rules (no typing animations, no fake terminals) don't apply here. Typed lines and real
commands in a terminal window are core patterns of this skill. The monospace font is for commands and
their output only, never for headlines or captions.

## Rules that prevent slop
- **Original every time.** Three directions, one chosen; none of the defaults in
  `guides/direction.md` without a reason; no sample-script line, no example scene with swapped content.
- **Nothing just appears.** Everything moves in the chosen motion language, and the camera never
  stops.
- **Show the product, not stock shapes:** the real UI, real commands, real output, rebuilt as
  components, never screenshots of someone else's product and never invented numbers.
- **Fill the frame.** Big type, UI cropped and scaled up; nothing tiny in empty space.
- **One idea per scene, a few words on screen.** The voice says it; the screen shows it.
- **The voice sounds spoken, not read** (`guides/voice.md`), and lists are read as one phrase.
- **Competitors are named fairly**, compared like with like, with dated, sourced prices.
- **No copying a reference video:** take its direction (pace, structure, techniques), never its scenes.
