export type Item = { id: string; createdAt: number };
export type Page = { items: Item[]; next: string | null };

// Items newest first. `cursor` is the `next` value from the previous page.
export function listFeed(all: Item[], limit: number, cursor: string | null = null): Page {
  const sorted = [...all].sort((a, b) => b.createdAt - a.createdAt);
  const after = cursor === null ? sorted : sorted.filter((i) => i.createdAt < Number(cursor));
  const items = after.slice(0, limit);
  const next = items.length === limit ? String(items[items.length - 1].createdAt) : null;
  return { items, next };
}
