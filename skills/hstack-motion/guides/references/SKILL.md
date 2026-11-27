---
name: hstack-motion-references
description: "Learning from reference videos and prompts without copying them. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Learning from references

The user will send videos they like and prompts written for other tools. They are inspiration: take
the **techniques** (how things move, how sound is built, how cuts land), never the **content** (their
scenes, layouts, copy, characters, logos, product). A video that looks like the reference with the
names swapped is a failure, even if the user likes the reference.

## 1. Break a video down (free, no model tokens)
```
bash <skill>/tools/analyze-ref.sh <video.mp4>
```
It writes `.hstack/motion/refs/<name>/`: `sheet.png` (one frame a second), `cuts.txt` (cut times),
`spectrum.png` (what the sound is made of over time) and `summary.txt` (length, cut count, loudness).
Read the sheet and the spectrum. For a fast cut, render the frames around it
(`ffmpeg -ss <t> -i v.mp4 -frames:v 6 -vf fps=12,tile=6x1 out.png`).

## 2. Write the techniques, not the scenes
Fill this in `.hstack/motion/refs/<name>/TECHNIQUES.md`, in your own words:
```
PACE: <average shot length, cuts per 10 s, where it slows down and speeds up>
CAMERA: <dolly into UI, slow push, whip, snap zoom, focus pulls, depth of field>
TYPE: <sizes, how words enter and leave, ghost words behind, type as a surface>
DEPTH: <layers, blur on far elements, parallax>
INTERACTION: <cursor-driven, buttons that morph, typing, states like "working…">
TRANSITIONS: <match cuts, wipes, morphs between scenes>
SOUND: <music style and tempo, how loud (summary.txt), what makes a sound (every click? every cut?),
       risers before reveals, silence used for weight>
COLOR & LIGHT: <stage, glows, gradients>
WHAT MAKES IT FEEL <organic / premium / energetic>: <the 3 things that matter most>
DO NOT TAKE: <its scenes, layouts, copy, product UI, characters, logos, color scheme>
```

## 3. Prompts written for other tools
Prompts for video generators (shot lists like "CUT 01 | 0.00–1.00s — …", "CHARACTER LOCK …") are
a source of **vocabulary and rhythm**, not a script. Extract:
- the **cut grammar**: how long a cut lasts, what changes between cuts (composition, color field,
  scale), how the peak is placed;
- the **effect vocabulary**: slams, shutter flashes, RGB splits, stamps, split screens, speed lines;
- the **sound plan**: what hits on each cut, where the drops and risers are;
- **consistency rules** like a character lock: a recurring character keeps its exact shape, color
  and features in every frame.

Never reuse their characters, words or brand elements. Map each technique to something true about
the product you're making a video for.

## 4. Use it
In `STORYBOARD.md`, the DIRECTIONS section names which reference techniques each direction borrows,
and the DEFAULTS CHECK confirms that no scene, layout or line was copied. In review, compare the
contact sheet with the reference sheet: if a viewer could mistake one for the other, it fails.
