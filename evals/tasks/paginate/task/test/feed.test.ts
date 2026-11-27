import { expect, test } from "bun:test";
import { listFeed } from "../src/feed";

test("first page is newest first", () => {
  const items = [{ id: "a", createdAt: 1 }, { id: "b", createdAt: 2 }];
  expect(listFeed(items, 1).items[0].id).toBe("b");
});
