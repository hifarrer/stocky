/**
 * Simple in-memory cache with TTL (Time To Live)
 * Helps reduce API calls by caching responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Set a value in cache with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a value from cache if not expired
   * @param key - Cache key
   * @returns Cached data or null if expired/not found
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Entry expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const apiCache = new Cache();

// Clear expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpired();
  }, 5 * 60 * 1000);
}

/**
 * Wrapper for fetch with caching
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param ttl - Cache TTL in milliseconds (default: 1 minute)
 * @returns Promise with response data
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl: number = 60000
): Promise<T> {
  const cacheKey = `${url}_${JSON.stringify(options || {})}`;
  
  // Check cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the response
  apiCache.set(cacheKey, data, ttl);
  
  return data;
}

/**
 * Cache TTL constants (in milliseconds)
 */
export const CacheTTL = {
  REALTIME: 5000,      // 5 seconds for real-time data
  SHORT: 30000,        // 30 seconds for frequently changing data
  MEDIUM: 60000,       // 1 minute for moderate data
  LONG: 300000,        // 5 minutes for slow-changing data
  EXTENDED: 600000,    // 10 minutes for static-ish data
};
