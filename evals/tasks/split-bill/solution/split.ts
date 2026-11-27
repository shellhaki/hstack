export function splitBill(totalCents: number, shares: number[]): number[] {
  if (!Number.isInteger(totalCents) || totalCents < 0) throw new Error("total must be whole, non-negative cents");
  if (shares.length === 0 || shares.some((s) => !(s >= 0) || !Number.isFinite(s))) throw new Error("invalid shares");
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum <= 0) throw new Error("shares must add up to more than zero");
  const exact = shares.map((s) => (totalCents * s) / sum);
  const parts = exact.map(Math.floor);
  let left = totalCents - parts.reduce((a, b) => a + b, 0);
  const order = exact.map((e, i) => [e - Math.floor(e), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) { if (left <= 0) break; parts[i]++; left--; }
  return parts;
}
