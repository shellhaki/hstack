export function slugify(title: string): string {
  const base = title.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!base) throw new Error("title has no letters or digits to make a slug from");
  if (base.length <= 60) return base;
  const cut = base.slice(0, 60);
  if (base[60] === "-") return cut.replace(/-+$/, "");
  const lastHyphen = cut.lastIndexOf("-");
  return lastHyphen > 0 ? cut.slice(0, lastHyphen) : cut;
}
