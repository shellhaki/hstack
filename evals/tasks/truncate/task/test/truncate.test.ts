import { expect, test } from "bun:test";
import { truncate } from "../src/truncate";

test("short text is unchanged", () => {
  expect(truncate("hello", 10)).toBe("hello");
});
