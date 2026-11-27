---
name: hstack-ui-icons
description: "Icons and logos. Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Icons and logos

Icons come from one icon library; logos come from the brand itself. Never draw an icon or a logo,
and never use emoji as icons.

## Icons: one library per project
`DESIGN.md` names the library, the style (stroke or solid), the stroke width and the sizes. Default:
**Hugeicons** (free set, about 4,000 icons, stroke style).
```
npm install @hugeicons/react @hugeicons/core-free-icons
```
```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon } from "@hugeicons/core-free-icons";

<HugeiconsIcon icon={Mic01Icon} size={20} strokeWidth={1.5} />
```
Find names in the installed package:
`grep -oE "[A-Za-z0-9]*Icon\b" node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts | grep -i <word> | sort -u`
Browse visually at https://hugeicons.com/icons.

- If the project already uses another library (lucide-react, which shadcn installs by default,
  Tabler, Phosphor), keep that one instead; never mix two libraries.
- Animated icons, only where an icon reacts to an action (copy, play, send): `@hugeicons-animated`
  or `@lucide-animated`, matching the project's library (`npx shadcn@latest search @hugeicons-animated -q "<word>"`).
- Not in the library: search by meaning across sets on Iconify,
  `curl -s "https://api.iconify.design/search?query=<word>&limit=10"`, and use only results from the
  same style. Nothing fits: send a `QUESTION`.
- Sizes: one or two (for example 16 in controls, 20 in navigation), from `DESIGN.md`. Color is
  `currentColor`, so icons follow the text color.
- An icon is never the only label for an action, unless the icon is universal (close, search, menu);
  icon-only buttons get an `aria-label`.

## Logos: from the brand, never redrawn
For integrations, "works with", sign-in buttons and payment marks:
1. **svgl** (shadcn registry): `npx shadcn@latest search @svgl -q <brand>`, then
   `npx shadcn@latest add @svgl/<brand>`. Or the API: `curl -s "https://api.svgl.app?search=<brand>"`
   returns light, dark and wordmark SVG links.
2. **Simple Icons:** `https://cdn.simpleicons.org/<slug>` (one-color marks), or the `simple-icons` package.
3. **The brand's own press or brand page**, when the first two don't have it.
Use the brand's own colors or one neutral color for a row of logos, the dark variant on dark
backgrounds, and never stretch, recolor parts of, or redraw a logo.

**Never imply a relationship that isn't real.** A "Trusted by" or "Customers" row uses only logos
the user gives you as real customers or partners. Without that, write `[NEED: customer logos]`.
Logos of tools the product really integrates with are fine in an integrations section.

## The product's own logo
Use the file the user gives (put it in `public/`). Without one, use the product name set in the
display font from `DESIGN.md` as a wordmark, and note `[NEED: logo]`. Never generate a logo mark.
