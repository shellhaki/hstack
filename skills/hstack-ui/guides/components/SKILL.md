---
name: hstack-ui-components
description: "Components: find, check, install (never hand-build). Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Components: find, check, install (never hand-build)

Pages are composed from registry parts. The shadcn CLI browses and installs them in any harness, with
no setup: run it with `npx shadcn@latest <command>` from the project root.

## Set up once per project
- No `components.json` yet: `npx shadcn@latest init` (React + Tailwind). Then apply `DESIGN.md`'s theme
  (step 4) to the CSS variables it created.
- Check the project's state any time: `npx shadcn@latest info`.

## Find
- **Blocks first** (whole sections and pages: dashboards, sidebars, login, settings, product grids):
  `npx shadcn@latest search @shadcn -q "<what you need>"`. Search for the job, not the look:
  "product grid", "checkout", "order history", "sidebar", "data table".
- **Then components** (button, card, table, dialog, sheet, select, tabs, chart, carousel, …):
  the same search; `npx shadcn@latest search @shadcn` with no query lists everything.
- Other registries the user names (for example `@magicui`): `npx shadcn@latest search @<registry> -q "…"`.
  Use only registries the user or `DESIGN.md` names.

## Interactive demos (features and steps)
Build each feature demo from registry parts, wired to sample data: `tabs`, `toggle-group`, `slider`,
`switch`, `accordion`, `hover-card`, `progress`, `chart`, `carousel`, `resizable`. Search the registry
for blocks first ("feature section", "interactive"); compose from components when no block fits.
State lives in the page with sample data only; no backend calls on a marketing page.

## Every interactive element is a registry part
Before writing JSX, map each element to its part and install it first: a clickable thing is `Button`
(or `Toggle`, `ToggleGroup`, `RadioGroup`), a text field `Input` or `Textarea`, a choice `Select`,
`RadioGroup` or `Checkbox`, a table `Table`, a popup `Dialog`, `Sheet` or `Popover`, a divider
`Separator`, a field label `Label`. A selectable card (a voice, a plan, a take) is a `ToggleGroup` or
`RadioGroup` item wrapping a `Card`, never a styled `<button>` or a `div` with `onClick`.
Plain `div`, `section`, `p` and headings are only for layout and text. `tools/check-prebuilt.mjs`
enforces this; it must print `ok` before any report.

## Check before installing
- `npx shadcn@latest view @shadcn/<item>`: its files and dependencies.
- `npx shadcn@latest docs <component>`: the API and usage examples. Use the documented props and
  variants; don't guess them.

## Install
- `npx shadcn@latest add @shadcn/<item> [@shadcn/<item> …]`. Blocks pull in the components they use.
- Install, then compose. Never copy a component's code from memory or from another site.

## Adapting installed parts
- Style through the theme variables and the component's own variants (`variant`, `size`). A look the
  variants don't cover goes into `DESIGN.md` first, then into the component once, used everywhere.
- Change an installed part's markup only to fit real content (more columns, different fields). Note
  the change in the done report.

## Missing parts
If no registry has it (search two or three phrasings first), stop and send a `QUESTION` to the
frontier with what you searched. The frontier either names a registry item or approves building it
from installed primitives, recorded in `DESIGN.md`.

## Optional: the shadcn MCP server
Some harnesses can browse the registry through MCP instead of the CLI: `npx shadcn@latest mcp init`
configures it for a supported client. The CLI above does the same job everywhere, so the MCP server is
a convenience, not a requirement.
