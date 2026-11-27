const UNIT: Record<string, number> = { h: 3_600_000, m: 60_000, s: 1_000, ms: 1 };
export function parseDuration(text: string): number {
  const s = text.replace(/\s+/g, "").toLowerCase();
  if (!s) throw new Error("empty duration");
  const re = /(\d+(?:\.\d+)?)(ms|h|m|s)/y;
  let total = 0, pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m) throw new Error(`invalid duration "${text}"`);
    total += Number(m[1]) * UNIT[m[2]];
    pos = re.lastIndex;
  }
  return Math.round(total);
}
