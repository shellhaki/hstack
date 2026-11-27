import { expect, test } from "bun:test";
import { slugify } from "../src/slug";

test("accents become plain letters", () => {
  expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  expect(slugify("Crème brûlée à Zürich")).toBe("creme-brulee-a-zurich");
});
test("punctuation and runs of separators collapse to one hyphen", () => {
  expect(slugify("Hello,   World!! -- again?")).toBe("hello-world-again");
  expect(slugify("snake_case and/or slashes")).toBe("snake-case-and-or-slashes");
});
test("no hyphen at the start or end", () => {
  expect(slugify("  --Hello--  ")).toBe("hello");
  expect(slugify("¿Qué pasa?")).toBe("que-pasa");
});
test("emoji and symbols are dropped", () => {
  expect(slugify("I ❤️ TypeScript 🚀")).toBe("i-typescript");
});
test("at most 60 characters, cut at a word boundary, no trailing hyphen", () => {
  const s = slugify("The quick brown fox jumps over the lazy dog and keeps running far away");
  expect(s.length).toBeLessThanOrEqual(60);
  expect(s.endsWith("-")).toBe(false);
  expect(s).toBe("the-quick-brown-fox-jumps-over-the-lazy-dog-and-keeps");
});
test("a single word longer than 60 is cut at 60", () => {
  expect(slugify("a".repeat(80))).toBe("a".repeat(60));
});
test("numbers are kept", () => {
  expect(slugify("Top 10 Tips for 2026")).toBe("top-10-tips-for-2026");
});
test("a title with nothing usable is an error, not an empty slug", () => {
  expect(() => slugify("🚀🚀🚀")).toThrow();
  expect(() => slugify("   ")).toThrow();
});
