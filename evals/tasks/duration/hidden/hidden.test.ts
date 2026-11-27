import { expect, test } from "bun:test";
import { parseDuration } from "../src/duration";

test("combined units", () => {
  expect(parseDuration("1h30m")).toBe(5_400_000);
  expect(parseDuration("2m3s250ms")).toBe(123_250);
});
test("ms is not read as minutes", () => {
  expect(parseDuration("500ms")).toBe(500);
  expect(parseDuration("1m500ms")).toBe(60_500);
});
test("fractions are allowed", () => {
  expect(parseDuration("1.5h")).toBe(5_400_000);
  expect(parseDuration("0.25s")).toBe(250);
});
test("spaces and case are tolerated", () => {
  expect(parseDuration(" 1h 30m ")).toBe(5_400_000);
  expect(parseDuration("10S")).toBe(10_000);
});
test("zero is a valid duration", () => {
  expect(parseDuration("0s")).toBe(0);
});
test("invalid input throws", () => {
  for (const bad of ["", "   ", "10", "h", "5x", "1h-30m", "-5s", "1.2.3s", "abc", "1hh"]) {
    expect(() => parseDuration(bad)).toThrow();
  }
});
test("result is whole milliseconds", () => {
  expect(parseDuration("0.0004s")).toBe(0);
  expect(Number.isInteger(parseDuration("1.3333s"))).toBe(true);
});
