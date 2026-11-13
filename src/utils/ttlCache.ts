/**
 * Bounded LRU + TTL cache with in-flight promise deduplication and concurrency limiter.
 * Prevents unbounded Map growth across long-lived Node servers and browser sessions.
 */

interface CacheEntry<V> {
  timestamp: number;
  value: V;
}

export class TtlCache<K, V> {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly store = new Map<K, CacheEntry<V>>();
  private readonly inFlight = new Map<K, Promise<V>>();

  constructor(options: { ttlMs: number; maxEntries: number }) {
    this.ttlMs = Math.max(0, options.ttlMs);
    this.maxEntries = Math.max(1, options.maxEntries);
  }

  get size(): number {
    return this.store.size;
  }

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (this.ttlMs > 0 && Date.now() - entry.timestamp >= this.ttlMs) {
      this.store.delete(key);
      return undefined;
    }

    // Refresh LRU order on read
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  set(key: K, value: V): void {
    const now = Date.now();
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      this.evictStaleOrOldest(now);
    }
    this.store.set(key, { timestamp: now, value });
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.inFlight.clear();
  }

  async getOrFetch(
    key: K,
    fetcher: () => Promise<V>,
    shouldCache: (value: V) => boolean = () => true
  ): Promise<V> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const existingPromise = this.inFlight.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = fetcher()
      .then((value) => {
        if (shouldCache(value)) {
          this.set(key, value);
        }
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  private evictStaleOrOldest(now: number): void {
    if (this.ttlMs > 0) {
      for (const [k, entry] of this.store) {
        if (now - entry.timestamp >= this.ttlMs) {
          this.store.delete(k);
        } else {
          // Keys are in insertion/LRU order; once a fresh entry is seen we can stop scanning
          break;
        }
      }
    }

    while (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) break;
      this.store.delete(oldestKey);
    }
  }
}

/**
 * Sets a key in a plain Map while keeping its size capped via FIFO/LRU eviction.
 */
export function setBoundedMap<K, V>(map: Map<K, V>, key: K, value: V, maxEntries: number = 500): void {
  if (map.has(key)) {
    map.delete(key);
  } else if (map.size >= maxEntries) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) {
      map.delete(oldest);
    }
  }
  map.set(key, value);
}

/**
 * Maps over an array with a fixed maximum number of concurrent async workers.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()));
  return results;
}
