---
name: hstack-motion-voice
description: "Voice. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Voice

A narrated video lives or dies on the voice. It must sound like a person talking, not reading.

## ElevenLabs setup
- Key in `video/.env` as `ELEVENLABS_API_KEY=…` (gitignored). Check the name: a typo (`zELEVEN…`)
  or a bare key with no name means the script finds nothing.
- `bun run voice` generates every line; `bun run voice <id> <id>` regenerates only those.
- Model: **`eleven_v3`**. It acts on delivery cues in square brackets and reads far more naturally
  than v2. It doesn't take `previous_text`/`next_text`.
- Voice: ask the user for male or female and a voice ID from the Voice Library. A good female default
  is Jessica (`cgSgspJ2msm6clMCkdW9`); a good male one is Brian (`nPczCjzI2devNBz1zQrb`).
- Settings for v3: `stability: 0.0` (creative), `similarity_boost: 0.8`.
- Pitfalls: a key without `voices_read` can't look up the voice's name (the script carries on with the
  ID). On the free plan, use `mp3_44100_128` (192 kbps needs Creator).

## Writing lines for it
Each script line has the clean `text` (for the screen and for timing) and a `say` (what the voice
gets), with cues:
```ts
{ id: "<scene>", text: "<the line as written>", say: "[fast] <the same line>" },
{ id: "<scene>", text: "<a question?>", say: "[curious] <a question?>" },
```
Useful cues: `[warm]`, `[confident]`, `[curious]`, `[excited]`, `[serious]`, `[playful]`, `[fast]`,
`[sighs]`. Use one or two per line; never `[excited]` on the brand name.
- A question needs its own sentence and a question mark to rise.
- Commas make pauses; remove the ones the user doesn't want.
- A line that's still slow gets `tempo: 1.12` (sped up afterwards with ffmpeg, pitch kept; the word
  timings are scaled to match).

## Timing to words
The voice script saves every word's start and end in `src/voice.json`. Scenes last as long as their
line plus a 0.2 s lead and 0.3 s tail; `at(id, "word")` returns the frame a word is said, so motion
lands on it. Cue words are matched without punctuation or case.

## Always two versions
Render the narrated composition and one without the voice (music and sound effects only), with the
same timing, so the user can pick. Without the voice, raise the music.
