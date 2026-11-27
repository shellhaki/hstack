---
name: hstack-motion-sound
description: "Sound: music, effects, the beat grid and the final mix. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Sound

Sound is half of why a video feels organic or cheap. The best product films are music-driven: every
cut and every interaction lands on the beat, and almost every visible action makes a small sound.

## Music: where it comes from, in this order
1. **The user's track** (ask first). Put it at `public/music/background.mp3`; extract one from a video
   with `ffmpeg -i in.mp4 -vn -c:a libmp3lame -q:a 2 public/music/background.mp3`.
2. **ElevenLabs Music** (`POST https://api.elevenlabs.io/v1/music`, `{ prompt, music_length_ms }`) if
   the user has a paid ElevenLabs plan (free plans get HTTP 402). Prompt with genre, instruments,
   tempo in BPM, mood and "no vocals", and ask for the video's length plus 2 s.
3. **Royalty-free libraries** the user downloads: YouTube Audio Library, Pixabay Music. Say a
   commercial song can get the video claimed.
4. **Last resort:** `bash scripts/synth-music.sh` synthesizes a simple loop locally. It is thin; say so.

Then **find the tempo** (from the library page, the prompt, or by counting beats in the waveform:
`ffmpeg -i music.mp3 -lavfi showwavespic=s=2000x200 wave.png`) and set `BPM` and `OFFSET` in
`src/beat.ts`. Scene lengths and every hit use `beat(n)` / `beats(n)` from then on.

## Effects
1. **Generate them with ElevenLabs** (`bun run sfx`, free plans included): realistic, made for the
   prompts in `src/sfx-list.ts`. Add prompts for what this video needs (a card landing, a key press, a
   glass pane breaking) instead of forcing the default set.
2. Free libraries if the user prefers: Pixabay sound effects, Freesound, ZapSplat.
3. **Last resort:** `bash scripts/synth-sfx.sh` makes simple synthetic blips locally.

`<Sfx name at volume length>` plays one only if the file exists, so a missing file never breaks a render.

| Effect | Where |
|---|---|
| `typing` (cut to the typing length) | typed commands and lines |
| `click`, `pop`, `blip` | a cursor click, chips and cards appearing |
| `message` | a chat message arriving |
| `swipe`, `whoosh`, `swoosh` | camera moves, wipes, slams |
| `riser` → `impact` | the build into a reveal or a drop |
| `shimmer`, `reveal` | reveals, the logo |
| `data`, `glitch`, `ratchet` | processing, encryption, counters |
| `tick`, `success` | checks and a good result |

**Density:** in an organic product film, nearly every visible action makes a sound, quietly (a card
landing, a cursor click, a toggle, text appearing). Silence is a choice for weight, used once or twice.

## The mix
- **Voice** sits on top. Music about 15 dB under it (volume ~0.07 for a loud track); effects 0.2–0.5.
- **No voice:** music carries the film (volume ~0.3–0.5), effects sit just under the beat.
- Fade music in 0.6 s and out 1.5 s, or end on the track's own ending if it's cut to length.
- **Measure the final file, always:**
  `ffmpeg -i out.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12`. Aim for about **-14 LUFS
  integrated** for YouTube and the web (-10 to -12 for loud social teasers) and a **true peak at or
  below -1 dBTP**. Too quiet: raise with `volume=<dB>` and finish with `alimiter=limit=0.89` (copy the
  video stream, re-encode audio only).
