import { expect, test } from "bun:test";
import { createCache } from "../src/cache";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function clock() { let t = 0; return { now: () => t, add: (ms: number) => { t += ms; } }; }

test("many callers at once share one load", async () => {
  let calls = 0;
  const c = createCache(async (k) => { calls++; await sleep(20); return k + "!"; }, 1000);
  const out = await Promise.all(Array.from({ length: 25 }, () => c.get("u1")));
  expect(calls).toBe(1);
  expect(new Set(out)).toEqual(new Set(["u1!"]));
});
test("after expiry, callers at once still share one load", async () => {
  let calls = 0; const k = clock();
  const c = createCache(async () => { calls++; await sleep(10); return calls; }, 1000, k.now);
  await c.get("u1");
  k.add(1000);
  await Promise.all(Array.from({ length: 10 }, () => c.get("u1")));
  expect(calls).toBe(2);
});
test("a cached value is reused until the TTL, and reloaded at the TTL", async () => {
  let calls = 0; const k = clock();
  const c = createCache(async () => ++calls, 1000, k.now);
  await c.get("u1"); k.add(999); expect(await c.get("u1")).toBe(1);
  k.add(1); expect(await c.get("u1")).toBe(2);
});
test("errors are not cached: the next call tries again", async () => {
  let calls = 0;
  const c = createCache(async () => { calls++; if (calls === 1) throw new Error("hiccup"); return "ok"; }, 60_000);
  await expect(c.get("u1")).rejects.toThrow("hiccup");
  expect(await c.get("u1")).toBe("ok");
  expect(calls).toBe(2);
});
test("callers waiting on a failing load all get the error, and nothing is cached", async () => {
  let calls = 0;
  const c = createCache(async () => { calls++; await sleep(10); if (calls === 1) throw new Error("hiccup"); return "ok"; }, 60_000);
  const r = await Promise.allSettled([c.get("u1"), c.get("u1"), c.get("u1")]);
  expect(r.every((x) => x.status === "rejected")).toBe(true);
  expect(calls).toBe(1);
  expect(await c.get("u1")).toBe("ok");
});
test("keys are independent: a slow key doesn't block another", async () => {
  const c = createCache(async (k) => { await sleep(k === "slow" ? 200 : 1); return k; }, 1000);
  const slow = c.get("slow");
  const t0 = Date.now();
  expect(await c.get("fast")).toBe("fast");
  expect(Date.now() - t0).toBeLessThan(100);
  await slow;
});
test("a value loaded for an old request isn't served past its TTL", async () => {
  const k = clock(); let calls = 0;
  const c = createCache(async () => { calls++; await sleep(5); return calls; }, 1000, k.now);
  await c.get("u1");
  k.add(5000);
  expect(await c.get("u1")).toBe(2);
});
