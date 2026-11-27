export class RateLimiter {
  private hits = new Map<string, number[]>();
  private calls = 0;
  constructor(private limit: number, private windowMs: number, private now: () => number = Date.now) {
    if (!(Number.isInteger(limit) && limit > 0) || !(windowMs > 0)) throw new Error("limit and windowMs must be positive");
  }
  allow(key: string): boolean {
    const t = this.now();
    if (++this.calls % 1000 === 0) this.sweep(t);
    const list = (this.hits.get(key) ?? []).filter((x) => t - x < this.windowMs);
    if (list.length >= this.limit) { this.hits.set(key, list); return false; }
    list.push(t); this.hits.set(key, list); return true;
  }
  private sweep(t: number) {
    for (const [k, list] of this.hits) if (list.every((x) => t - x >= this.windowMs)) this.hits.delete(k);
  }
}
