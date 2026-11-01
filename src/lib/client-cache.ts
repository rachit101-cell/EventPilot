// Lightweight in-memory and sessionStorage client-side cache for instant (0ms) page navigation
const cache = new Map<string, { data: any; timestamp: number }>();

export const ClientCache = {
  get<T>(key: string, maxAgeMs = 30000): T | null {
    if (typeof window === "undefined") return null;

    // Check memory cache
    const mem = cache.get(key);
    if (mem && Date.now() - mem.timestamp < maxAgeMs) {
      return mem.data as T;
    }

    // Check session storage
    try {
      const stored = sessionStorage.getItem(`ep_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < maxAgeMs) {
          cache.set(key, parsed);
          return parsed.data as T;
        }
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }

    return null;
  },

  set(key: string, data: any) {
    if (typeof window === "undefined") return;
    const entry = { data, timestamp: Date.now() };
    cache.set(key, entry);
    try {
      sessionStorage.setItem(`ep_cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      // Ignore quota errors
    }
  },

  invalidate(keyPrefix: string) {
    if (typeof window === "undefined") return;
    for (const k of cache.keys()) {
      if (k.startsWith(keyPrefix)) cache.delete(k);
    }
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(`ep_cache_${keyPrefix}`)) {
          sessionStorage.removeItem(k);
        }
      }
    } catch (e) {}
  },
};
