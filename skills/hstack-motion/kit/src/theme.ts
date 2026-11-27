import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// The brand, from the product's own design tokens (guides/from-codebase/SKILL.md). Fill these in first.
// Replace the fonts too: use the product's own display and text fonts (@remotion/google-fonts or a
// local file), not Inter by habit.
export const brand = {
  name: "Product",           // the product name as written
  url: "example.com",        // the website the video ends on
  logo: "logo.png",          // a file in public/
  accent: "#f5e73f",         // the brand color, used as fills only
  ink: "#0b0b0c",            // text on the light stage
  paper: "#f6f6f3",          // the light stage
  night: "#141416",          // the dark stage, if the storyboard is dark
  muted: "#71717a",
  line: "#e4e4e0",
};

// The stage every scene stands on, chosen in the direction (guides/direction/SKILL.md). Nothing here is a
// default look: set each field for this video. `background` may be the brand color, a dark tone or
// paper; `pattern` and `glow` exist only if the concept calls for them.
export const stage = {
  background: brand.paper,
  text: brand.ink,
  pattern: "none" as "none" | "dots" | "grid" | "lines", // keep "none": no grid textures unless the user asks
  glow: false,
  grain: 0, // 0 to 0.08
};

export const sans = loadInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["400", "600", "700"], subsets: ["latin"] }).fontFamily;
