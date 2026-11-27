import { expect, test } from "bun:test";
import { listFeed, type Item } from "../src/feed";

function walk(all: Item[], limit: number) {
  const seen: string[] = [];
  let cursor: string | null = null;
  for (let guard = 0; guard < 1000; guard++) {
    const page = listFeed(all, limit, cursor);
    seen.push(...page.items.map((i) => i.id));
    if (!page.next) break;
    cursor = page.next;
  }
  return seen;
}

const ties: Item[] = [
  { id: "a", createdAt: 5 }, { id: "b", createdAt: 5 }, { id: "c", createdAt: 5 },
  { id: "d", createdAt: 4 }, { id: "e", createdAt: 4 }, { id: "f", createdAt: 3 },
];

test("every item exactly once when timestamps tie", () => {
  for (const limit of [1, 2, 4]) {
    const seen = walk(ties, limit);
    expect(seen.length).toBe(ties.length);
    expect(new Set(seen).size).toBe(ties.length);
  }
});
test("order is stable across pages and newest first", () => {
  const seen = walk(ties, 2);
  const at = (id: string) => ties.find((i) => i.id === id)!.createdAt;
  for (let i = 1; i < seen.length; i++) expect(at(seen[i - 1])).toBeGreaterThanOrEqual(at(seen[i]));
  expect(walk(ties, 2)).toEqual(walk(ties, 3));
});
test("no empty trailing page when the last page is exactly full", () => {
  const items: Item[] = [{ id: "a", createdAt: 2 }, { id: "b", createdAt: 1 }];
  const p1 = listFeed(items, 2);
  expect(p1.items.length).toBe(2);
  expect(p1.next).toBeNull();
});
test("does not mutate the input", () => {
  const copy = ties.map((i) => ({ ...i }));
  listFeed(ties, 2);
  expect(ties).toEqual(copy);
});
test("a new item arriving between pages does not cause duplicates", () => {
  const items = [...ties];
  const p1 = listFeed(items, 2);
  items.push({ id: "new", createdAt: 9 });
  const p2 = listFeed(items, 2, p1.next);
  const ids = [...p1.items, ...p2.items].map((i) => i.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).not.toContain("new");
});
