import { expect, test } from "bun:test";
import { dueDate } from "../src/due";

test("Friday goes to Monday", () => {
  expect(dueDate(new Date("2026-12-04T15:00:00Z"), "UTC", [])).toBe("2026-12-07");
});
test("weekend goes to Monday... after the weekend", () => {
  expect(dueDate(new Date("2026-12-05T12:00:00Z"), "UTC", [])).toBe("2026-12-07");
  expect(dueDate(new Date("2026-12-06T12:00:00Z"), "UTC", [])).toBe("2026-12-07");
});
test("uses the customer's local date, not UTC", () => {
  // Friday 21:30 in New York is already Saturday in UTC.
  expect(dueDate(new Date("2026-12-05T02:30:00Z"), "America/New_York", [])).toBe("2026-12-07");
  // Monday 08:00 in Tokyo is still Sunday in UTC.
  expect(dueDate(new Date("2026-11-29T23:00:00Z"), "Asia/Tokyo", [])).toBe("2026-12-01");
});
test("skips holidays, including several in a row and next to weekends", () => {
  expect(dueDate(new Date("2026-12-24T10:00:00Z"), "UTC", ["2026-12-25"])).toBe("2026-12-28");
  expect(dueDate(new Date("2026-12-24T10:00:00Z"), "UTC", ["2026-12-25", "2026-12-28", "2026-12-29"])).toBe("2026-12-30");
});
test("across a daylight-saving change", () => {
  // US clocks go back on 2026-11-01 (Sunday). Saturday night local.
  expect(dueDate(new Date("2026-11-01T03:30:00Z"), "America/New_York", [])).toBe("2026-11-02");
  // Europe clocks go forward on 2026-03-29 (Sunday). Friday 23:30 local in Berlin.
  expect(dueDate(new Date("2026-03-27T22:30:00Z"), "Europe/Berlin", [])).toBe("2026-03-30");
});
test("across month and year ends, and a leap day", () => {
  expect(dueDate(new Date("2026-12-31T12:00:00Z"), "UTC", [])).toBe("2027-01-01");
  expect(dueDate(new Date("2028-02-28T12:00:00Z"), "UTC", [])).toBe("2028-02-29");
});
test("rejects an unknown time zone", () => {
  expect(() => dueDate(new Date(), "Mars/Base", [])).toThrow();
});
