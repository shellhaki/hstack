# Page recipes

What each kind of page contains, in order. Build from library components; style only from `DESIGN.md`.

| Page | Sections, in order | Notes |
|---|---|---|
| Marketing landing | header, a first screen built from the product's own concept and its real product, proof (only if real), features shown with the real product, how it works as one walkthrough of real screens or commands, pricing teaser or call to action, footer | not the stock hero or the section conveyor (anti-slop "No formula landing pages"); no mock demos; vary the section rhythm; smooth scrolling (`guides/scroll/SKILL.md`) |
| Pricing | header, 2 to 4 tier cards (one highlighted), comparison table, FAQ, CTA | prices only from the brief |
| App shell | sidebar (nav, then account), header (title, primary action), content | sidebar collapses to a sheet on phone |
| List + detail | filters row, table or list, row opens a sheet or a detail page | table if 3+ attributes or 7+ rows |
| Dashboard | 3 to 4 KPI cards, one main chart, recent activity table | no chart without real data |
| Settings | left section nav (top tabs on phone), grouped forms, save per section | destructive actions last, with confirm |
| Auth | centered card: providers first, then email and password, then the switch link | no marketing on auth pages |
| Empty project | one illustration or icon, one line, one primary action | |

## Components: when to use which
- **Dialog:** a confirm or a short form (3 fields or fewer). Longer: a sheet or a page.
- **Sheet:** details or edits without leaving a list.
- **Table vs list:** a table for comparing attributes; a list for scanning items.
- **Toast:** confirms an action that already happened; never for errors that need action.
- **Tabs:** sibling views of one object; not for navigation between pages.
- **Badge:** a status, at most one per row.
