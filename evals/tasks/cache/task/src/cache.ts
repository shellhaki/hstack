type Entry<T> = { at: number; value?: T; error?: unknown };

export function createCache<T>(load: (key: string) => Promise<T>, ttlMs: number, now: () => number = Date.now) {
  const entries = new Map<string, Entry<T>>();
  return {
    async get(key: string): Promise<T> {
      const e = entries.get(key);
      if (e && now() - e.at < ttlMs) {
        if (e.error) throw e.error;
        return e.value as T;
      }
      try {
        const value = await load(key);
        entries.set(key, { at: now(), value });
        return value;
      } catch (error) {
        entries.set(key, { at: now(), error });
        throw error;
      }
    },
  };
}
