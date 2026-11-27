---
name: hstack-motion-review
description: "Reviewing a video. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Reviewing a video

Review stills, not full renders: a contact sheet of 8–15 frames costs seconds, a full render minutes.
Take frames at rest, mid-animation and mid-transition (`tools/stills.sh`). Frames start at 0 and end
one before the composition's length (Remotion prints the length on an out-of-range frame).

## Checklist
- [ ] Follows the approved direction and storyboard, scene by scene; no invented facts.
- [ ] Original: none of the defaults in `guides/direction/SKILL.md` without the reason the storyboard gives;
      no kit example scene with swapped content; no sample-script line. Would this sheet be mistaken
      for another product's video? If yes, it fails.
- [ ] Fills the frame: the subject is large, UI is cropped and scaled up, no shot mostly empty.
- [ ] No line or shape crosses through text; no fake glyph parts; no half-faded type lingering.
- [ ] Hyper: every frame works as a poster (field + subject + marks, scale contrast, composed layout);
      see `guides/hyper/SKILL.md`, "Every frame is a poster".
- [ ] Every element is inside the frame and nothing overlaps by accident (long text in bubbles wraps).
- [ ] At most two lines of text on screen; every word readable at phone size.
- [ ] The brand color is only fills on light backgrounds; contrast is fine.
- [ ] Motion follows the chosen language; siblings stagger; the camera keeps moving.
- [ ] Transitions vary and each has a sound.
- [ ] Motion lands on the spoken word (compare `at()` cues with the voice).
- [ ] Real product UI, commands and numbers, matching the code; competitor facts dated and sourced.
- [ ] The voice line sounds spoken: listen to each generated line once (`public/voice/<id>.mp3`).
- [ ] Both versions render (with and without voice), at the length expected.

Corrections name the scene, the element and the expected value ("Problem: WhatsApp bubble text
overflows; add overflowWrap anywhere"), never "make it nicer".
