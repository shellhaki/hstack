export type Item = { id: string; createdAt: number };
export type Page = { items: Item[]; next: string | null };

const before = (a: Item, b: { createdAt: number; id: string }) =>
  a.createdAt < b.createdAt || (a.createdAt === b.createdAt && a.id < b.id);

export function listFeed(all: Item[], limit: number, cursor: string | null = null): Page {
  const sorted = [...all].sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
  let after = sorted;
  if (cursor !== null) {
    const { createdAt, id } = JSON.parse(cursor);
    after = sorted.filter((i) => before(i, { createdAt, id }));
  }
  const items = after.slice(0, limit);
  const more = after.length > limit;
  const last = items[items.length - 1];
  return { items, next: more && last ? JSON.stringify({ createdAt: last.createdAt, id: last.id }) : null };
}
