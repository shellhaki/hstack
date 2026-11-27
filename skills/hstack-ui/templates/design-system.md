# DESIGN.md template

Copy this into `.hstack/ui/DESIGN.md` and fill it as `guides/writing-design-md/SKILL.md` describes. Write values, not
adjectives ("16px", not "comfortable"). Anything the brief doesn't answer: write `[ASK]`.

```
# Design system
Written from guides/design-principles/SKILL.md on <date>; user-named sites: <none | site>
Type pairing: <id from type.json>; palette: <id from palettes.json>

## Product
Trade and audience; three mood words; the product's own material; light or dark first

## Choices (each with the product line it follows from)
Type, color (primary button: inverted neutral | accent), layout pattern, hero imagery, brand art,
radius family, motion

## Tokens
Colors (role: value): background, surface, surface-2, text, muted, border, primary, primary-text, danger, success
Fonts: display <family, weights>, text <family, weights>, mono <family>
Type scale (px / line height / weight): xs, sm, base, lg, xl, 2xl, display
Spacing scale: 4 8 12 16 24 32 48 64 96 128 (use only these)
Radius: controls <px>, cards <px>, pills <px or none>
Borders: <width, color>; shadows: <none | the one shadow>
Motion: duration <ms>, easing <curve>; what moves (hover, open, enter) and what never moves
Background: <registry item, e.g. @react-bits/Threads-TS-TW>, where (hero only), colors (tokens), speed, opacity; why it fits the product (one line); static fallback
Scroll: Lenis (marketing pages only, lerp <0.08-0.12>) | native
Palette source: <palettes.json id | tweakcn theme | thecolorapi scheme from <accent hex>>; contrast.mjs passes
Icons: <library, e.g. Hugeicons free>, stroke <px>, sizes <px, px>; logos from svgl / Simple Icons

## Layout
Content widths: text <px>, page <px>; gutters: desktop <px>, phone 16px
Shells used: marketing / app (sidebar <px> + header <px>) / settings / auth
Section rhythm: vertical padding desktop <px>, phone <px>
Density: comfortable | compact (row height <px>)

## Components (variant names this project uses)
Button: primary, secondary, ghost, destructive; sizes; one per view is primary
Input, select, checkbox, switch: height <px>, label position, error style
Card, table, list, tabs, dialog, sheet, menu, toast, badge, avatar: the look in one line each
States for every data view: empty (icon, one line, one action), loading (skeleton), error (message + retry)

## Signature (this project's own)
2 to 4 concrete moves that come from the product's material, never type tricks (guides/anti-slop/SKILL.md) and never a move from guides/design-principles/SKILL.md section 8.

## Do / don't (project-specific)
```
