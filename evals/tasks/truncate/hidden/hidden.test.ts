import { expect, test } from "bun:test";
import { truncate } from "../src/truncate";

const chars = (s: string) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].length;

test("cut text ends with … and fits", () => {
  const r = truncate("The quick brown fox jumps", 10);
  expect(r.endsWith("…")).toBe(true);
  expect(chars(r)).toBeLessThanOrEqual(10);
});
test("text exactly max long is unchanged", () => {
  expect(truncate("abcdefghij", 10)).toBe("abcdefghij");
});
test("never splits an emoji or accented character", () => {
  const r = truncate("👍🏽👍🏽👍🏽👍🏽👍🏽👍🏽", 4);
  expect(r).toBe("👍🏽👍🏽👍🏽…");
  const e = truncate("ééééé", 3);
  expect(e).toBe("éé…");
  const flag = truncate("🇳🇬🇳🇬🇳🇬", 2);
  expect(flag).toBe("🇳🇬…");
});
test("no space left before the ellipsis", () => {
  expect(truncate("hello world again", 7)).toBe("hello…");
});
test("counts characters the way a person does", () => {
  expect(truncate("👨‍👩‍👧 family", 20)).toBe("👨‍👩‍👧 family");
});
test("edge cases", () => {
  expect(truncate("", 5)).toBe("");
  expect(truncate("abc", 1)).toBe("…");
  expect(() => truncate("abc", 0)).toThrow();
});
