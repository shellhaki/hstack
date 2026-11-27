---
name: hstack-ui-scroll
description: "Smooth scrolling. Part of the hstack-ui skill: loaded on demand through its routing, not on its own."
user-invocable: false
disable-model-invocation: true
---

# Smooth scrolling

Smooth scrolling makes a long marketing page feel calm and lets scroll-linked motion stay in sync.
It is a `DESIGN.md` choice (Motion section: `Scroll: Lenis` or `Scroll: native`), never added by
default.

## When
- **Use it** on marketing and editorial pages with scroll-linked motion (reveals, sticky product
  walkthroughs, parallax in the background `DESIGN.md` names).
- **Don't** on app screens, dashboards, docs, forms, or anything with its own scroll areas (tables,
  chat, code). Native scrolling is faster to use there.

## Install (Lenis)
```
npm install lenis
```
Next.js App Router: one client provider in the root layout of the marketing pages only.
```tsx
"use client";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true, anchors: true }}>
      {children}
    </ReactLenis>
  );
}
```
Inside it, `useLenis()` gives the instance: `lenis.scrollTo("#pricing")` for in-page links.

## Rules
1. **Reduced motion:** with `prefers-reduced-motion: reduce`, render children without `ReactLenis`
   (native scrolling).
2. **Inner scroll areas keep native scrolling:** add `data-lenis-prevent` to dialogs, sheets,
   dropdown lists, code blocks, tables and any `ScrollArea`.
3. **Light:** `lerp` 0.08 to 0.12. No scroll-jacking: never snap the page section by section, never
   change the scroll speed per section, never block scrolling while an animation plays.
4. **Scroll-linked motion** uses `motion`'s `useScroll` and `useTransform` (or Lenis' scroll event),
   never a scroll listener that sets state on every frame.
5. **Keyboard and anchors still work:** Page Down, Space, Home, End and `#links` scroll as expected;
   focus moves to the target.
6. **Touch:** leave `syncTouch` off; phones keep their native scrolling.

## Check
Scroll the page with a wheel, a trackpad, the keyboard and an anchor link; open a dialog and scroll
inside it; turn on reduced motion and confirm the page scrolls natively.
