type Entry<T> = { at: number; value: T };
export function createCache<T>(load: (key: string) => Promise<T>, ttlMs: number, now: () => number = Date.now) {
  const entries = new Map<string, Entry<T>>();
  const inflight = new Map<string, Promise<T>>();
  return {
    get(key: string): Promise<T> {
      const e = entries.get(key);
      if (e && now() - e.at < ttlMs) return Promise.resolve(e.value);
      const running = inflight.get(key);
      if (running) return running;
      const p = load(key).then(
        (value) => { entries.set(key, { at: now(), value }); return value; },
      ).finally(() => inflight.delete(key));
      inflight.set(key, p);
      return p;
    },
  };
}
