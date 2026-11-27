import { expect, test } from "bun:test";
import { RateLimiter } from "../src/limit";

function clock(start = 1_000_000) { let t = start; return { now: () => t, add: (ms: number) => { t += ms; } }; }

test("allows exactly the limit, then blocks", () => {
  const c = clock(); const l = new RateLimiter(5, 10_000, c.now);
  expect(Array.from({ length: 6 }, () => l.allow("u"))).toEqual([true, true, true, true, true, false]);
});
test("any 10-second window, not fixed buckets", () => {
  const c = clock(); const l = new RateLimiter(5, 10_000, c.now);
  c.add(9_000); for (let i = 0; i < 5; i++) expect(l.allow("u")).toBe(true);
  c.add(2_000); // a fixed 10s bucket would have reset here
  expect(l.allow("u")).toBe(false);
});
test("frees up exactly when the oldest request leaves the window", () => {
  const c = clock(); const l = new RateLimiter(5, 10_000, c.now);
  for (let i = 0; i < 5; i++) { expect(l.allow("u")).toBe(true); c.add(1_000); }
  // now = start + 5000; oldest at start
  c.add(4_999); expect(l.allow("u")).toBe(false);
  c.add(1); expect(l.allow("u")).toBe(true);
});
test("blocked requests don't use up the allowance", () => {
  const c = clock(); const l = new RateLimiter(2, 10_000, c.now);
  l.allow("u"); l.allow("u");
  for (let i = 0; i < 50; i++) l.allow("u");
  c.add(10_000);
  expect(l.allow("u")).toBe(true);
  expect(l.allow("u")).toBe(true);
});
test("keys are independent", () => {
  const c = clock(); const l = new RateLimiter(1, 10_000, c.now);
  expect(l.allow("a")).toBe(true);
  expect(l.allow("b")).toBe(true);
  expect(l.allow("a")).toBe(false);
});
test("memory does not grow forever with many one-off keys", () => {
  const c = clock(); const l = new RateLimiter(5, 1_000, c.now);
  for (let i = 0; i < 20_000; i++) { l.allow("k" + i); c.add(1); }
  // The largest collection the limiter holds (Map, Set, array or plain object) must stay well
  // below the 20,000 keys it has seen: only about 1,000 are inside the window.
  const sizeOf = (v: any): number => v instanceof Map || v instanceof Set ? v.size : Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0;
  const biggest = Math.max(0, ...Object.values(l as any).map(sizeOf));
  expect(biggest).toBeLessThan(5_000);
});
test("rejects nonsense configuration", () => {
  expect(() => new RateLimiter(0, 1000)).toThrow();
  expect(() => new RateLimiter(5, 0)).toThrow();
});
