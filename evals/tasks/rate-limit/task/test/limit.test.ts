import { expect, test } from "bun:test";
import { RateLimiter } from "../src/limit";

test("allows the first request", () => {
  expect(new RateLimiter(5, 10_000).allow("u1")).toBe(true);
});
