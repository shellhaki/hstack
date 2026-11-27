---
name: hstack-ui-color
description: "Choosing a color combination. Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Choosing a color combination

A palette is chosen once, in `DESIGN.md`, from real sources, and checked by a script. Never pick
colors from memory ("a nice indigo"), and never take a reference site's colors.

## 1. Pick a starting point (one of these)
- **Curated palettes (default):** `<skill>/vendor/taste-skill/palettes.json`, by `id`, matched to the
  trade.
- **Complete shadcn themes from tweakcn:** list them with
  `curl -s https://tweakcn.com/r/registry.json | grep -o '"name": *"[^"]*"'`, read one with
  `curl -s https://tweakcn.com/r/themes/<name>.json` (all light and dark variables). Install it with
  `npx shadcn@latest add https://tweakcn.com/r/themes/<name>.json`. Never pick a theme named after a
  company or product (`supabase`, `vercel`, `claude`, `twitter`, `t3-chat` and similar): that is
  someone else's brand. A tweakcn theme also sets fonts; keep the fonts from `DESIGN.md`.
- **A scheme from one accent:** once the accent is chosen, generate the supporting colors:
  `curl -s "https://www.thecolorapi.com/scheme?hex=<HEX without #>&mode=<mode>&count=5"`, where mode is
  `monochrome`, `analogic`, `complement`, `analogic-complement` or `triad`. Read `colors[].hex.value`.
- **Colormind** (palette suggestions, optionally around fixed colors):
  `curl -s -X POST -d '{"model":"default"}' http://colormind.io/api/` returns five RGB colors; to keep
  some, pass them and `"N"` for the rest: `{"model":"default","input":[[10,13,20],"N","N","N","N"]}`.

## 2. Turn it into roles
Fill the `DESIGN.md` color roles: background, surface, surface-2, text, muted, border, primary,
primary-text, danger, success, for light and dark if the project has both. Rules:
- One accent (primary) and neutrals for everything else. A second hue only for meaning (danger,
  success), never decoration.
- Neutrals carry a little of the accent's hue (tinted greys), not pure grey next to a colored accent.
- The accent appears rarely: primary actions, the active state, one highlight per view.
- Different from the accent of every site in `guides/design-principles/SKILL.md` section 8.
- The primary button is the inverted neutral by default (`guides/design-principles/SKILL.md` section 2).

## 3. Check contrast (required)
After writing the theme into the CSS variables:
```
node <skill>/tools/contrast.mjs app/globals.css
```
It checks text on background, muted text, card, popover, primary, secondary, accent (4.5:1), and the
primary, destructive and ring colors against the background (3:1), in `:root` and `.dark`. It must
exit 0. For any single pair: `node <skill>/tools/contrast.mjs "#0a0d14" "#8ab4e8"`.
Fix a failure by moving lightness, never by dropping the pair.
