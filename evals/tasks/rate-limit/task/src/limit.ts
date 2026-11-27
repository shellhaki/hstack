export class RateLimiter {
  constructor(private limit: number, private windowMs: number, private now: () => number = Date.now) {}

  allow(key: string): boolean {
    throw new Error("not implemented");
  }
}
