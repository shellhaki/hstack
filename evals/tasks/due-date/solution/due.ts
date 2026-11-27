export function dueDate(sentAt: Date, timeZone: string, holidays: string[]): string {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const local = fmt.format(sentAt);
  const [y, m, d] = local.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  const off = new Set(holidays);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  do { day.setUTCDate(day.getUTCDate() + 1); } while (day.getUTCDay() === 0 || day.getUTCDay() === 6 || off.has(iso(day)));
  return iso(day);
}
