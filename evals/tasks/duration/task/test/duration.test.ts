import { expect, test } from "bun:test";
import { parseDuration } from "../src/duration";

test("seconds", () => {
  expect(parseDuration("45s")).toBe(45_000);
});
