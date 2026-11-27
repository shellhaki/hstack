import { expect, test } from "bun:test";
import { dueDate } from "../src/due";

test("Monday to Tuesday", () => {
  expect(dueDate(new Date("2026-11-30T15:00:00Z"), "UTC", [])).toBe("2026-12-01");
});
