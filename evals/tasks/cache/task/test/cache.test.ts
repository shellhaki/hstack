import { expect, test } from "bun:test";
import { createCache } from "../src/cache";

test("returns the loaded value", async () => {
  const c = createCache(async (k) => k.toUpperCase(), 1000);
  expect(await c.get("a")).toBe("A");
});
