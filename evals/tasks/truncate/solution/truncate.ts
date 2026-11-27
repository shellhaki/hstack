const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export function truncate(text: string, max: number): string {
  if (!Number.isInteger(max) || max < 1) throw new Error("max must be a positive whole number");
  const g = [...seg.segment(text)].map((s) => s.segment);
  if (g.length <= max) return text;
  return g.slice(0, max - 1).join("").trimEnd() + "…";
}
