---
name: hstack-motion-sound
description: "Sound. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Sound

Small sounds under the motion make a video feel finished, even before music.

## Effects
`kit/src/sfx-list.ts` lists each effect with the prompt it is generated from (ElevenLabs sound
generation, `bun run sfx`, saved in `public/sfx/`). `<Sfx name at volume length>` plays one only if
it exists, so a missing file never breaks a render. The set that works:

| Effect | Where |
|---|---|
| `typing` (cut to the typing length) | typed commands and lines |
| `pop`, `blip` | chips, pills, nodes appearing |
| `message` | a chat message arriving |
| `slot` | slot reels, rolling words, reel transitions |
| `ratchet` | counters and bars growing |
| `swipe`, `whoosh`, `swoosh` | whips, push-throughs, slams |
| `shimmer`, `reveal`, `impact` | reveals, the lock, the logo |
| `data`, `glitch` | scrambling, encryption, the risk word |
| `tick`, `success` | checks and a good result |

Free alternatives if the user prefers: Pixabay sound effects, Freesound, ZapSplat.

## Levels
- Effects 0.2–0.5, never louder than the voice.
- Music: the user's or royalty-free (YouTube Audio Library). Extract it from a video with
  `ffmpeg -i in.mp4 -vn -c:a libmp3lame -q:a 2 public/music/background.mp3`. Measure both with
  `ffmpeg -i f.mp3 -af volumedetect -f null -` and put the music about 15 dB under the voice
  (around 0.07 for a loud track); louder (around 0.2) in the version without voice. Fade in 0.6 s,
  out 1.5 s.
- Warn the user that a commercial song can get the video claimed on YouTube.
