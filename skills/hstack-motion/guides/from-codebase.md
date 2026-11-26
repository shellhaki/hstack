# Reading a codebase for a video

The best product videos show the real product. Collect these before writing the storyboard, each
with the file it came from:

1. **Name, pitch and domain:** README, landing page copy, `package.json`/`go.mod` description.
2. **Look:** the app's design tokens (CSS variables, Tailwind theme): background, surface, text,
   muted, line, brand color, radius, fonts. Copy them into `video/src/theme.ts`. Check contrast
   wherever the brand color sits behind or in text.
3. **Logo:** the icon and wordmark from `public/` or `assets/`.
4. **Real screens:** the app's main screens (sidebar labels, tables, pills, empty states). Rebuild
   them as video components with the same tokens and sample data; never invent menu items the app
   doesn't have.
5. **Real commands and output:** for a CLI, the commands (`--help`, the command switch) and the exact
   success strings it prints (`✓ Pushed 12 secrets to development`). Search the source for the
   output functions.
6. **Real numbers:** prices and limits from the billing code, never from memory. Competitor prices from
   their own pages, dated, and footnoted on screen.
7. **Install or sign-up path:** the website, the install command; the video ends on the website.
8. **The product's world:** the objects, places and rituals it replaces or lives next to, and the words
   its users use. This is where the concept comes from (`guides/direction.md`).

Anything missing is a `[NEED: …]` in the storyboard, for the user to fill, not a guess.
