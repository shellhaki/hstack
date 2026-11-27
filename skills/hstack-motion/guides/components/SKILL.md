---
name: hstack-motion-components
description: "Prebuilt Remotion components from the snapcn registry (MIT): when to use them and how to add them. Part of the hstack-motion skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Prebuilt components (snapcn)

[snapcn](https://snapcn.dev) is a shadcn-style registry of Remotion components (Shadcn Labs, MIT). The
CLI copies the source into the project, so you can read and change every line. Use a component when
it does the job better than writing it from the kit: product screens and devices, a cursor driving a
UI, an AI prompt being typed and answered, captions, logo reveals, polished text effects.

**Free (MIT) components only.** snapcn also lists "Pro" components; their license terms aren't
published, so don't use them unless the user says they have a Pro license.

## Setup (once per video project)
1. `components.json` at the project root (shadcn init doesn't recognise Remotion; write it by hand):
   ```json
   { "$schema": "https://ui.shadcn.com/schema.json", "style": "new-york", "rsc": false, "tsx": true,
     "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true },
     "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
     "iconLibrary": "lucide" }
   ```
2. The `@/` alias, in `tsconfig.json` (`"paths": { "@/*": ["./src/*"] }`, plus `"baseUrl": "."` on
   TypeScript 5) **and** in `remotion.config.ts`, because Remotion's bundler doesn't read tsconfig:
   ```ts
   import path from "node:path";
   Config.overrideWebpackConfig((c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}), "@": path.join(process.cwd(), "src") } } }));
   ```
3. Add a component: `bunx shadcn@latest add @snapcn/<slug>`. Files land in
   `src/components/snap-cn/` plus the shared `src/lib/snap-cn-ui/`.

## Useful free components, by job
| Job | Slugs |
|---|---|
| Titles and text | `text-reveal`, `punch-lines`, `word-flip`, `text-swap`, `type-morph`, `text-highlight`, `text-rewrite`, `word-gather`, `title-sweep`, `drop-line` |
| A product on a screen | `laptop-frame`, `phone-frame`, `phone-stack`, `screen-recording`, `capture-reveal`, `terminal-simulator` |
| A cursor using the UI | `cursor-track`, `click-type`, `button-press` |
| AI prompt and answer | `prompt-send`, `search-typing`, `answer-stream`, `answer-highlight`, `agent-steps` |
| Logos and endings | `logo-assemble`, `logo-collapse`, `logo-flicker`, `block-wordmark`, `bloom-lockup`, `wordmark-cut` |
| Captions | `word-captions`, `karaoke-captions` |
| Transition | `dot-bloom` |

## Rules
- **Read the component file before using it.** Know its props and timing (they're in frames). Never
  ship its default text ("Meet Acme Billing").
- **Theme it from `theme.ts`:** pass the `theme` and `mode` props (`"dark"` on a dark stage) so its
  colors and fonts are the product's, not snapcn's.
- **One motion language:** a component's motion must match the direction. Change its timing props
  (or its code) when it doesn't.
- **Don't stack a component on a kit piece that does the same job.** Pick one.
- Record every component used in the storyboard's Sources line, with "snapcn (MIT)".
