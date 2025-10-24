/**
 * Simplified caching for API requests
 * Lightweight and performant
 */

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Simple cached fetch with request deduplication
 * If multiple components request the same data simultaneously,
 * only one request is made
 */
export async function simpleFetch<T>(
  url: string,
  options?: RequestInit,
  cacheDuration: number = 60000 // 1 minute default
): Promise<T> {
  const cacheKey = `${url}_${JSON.stringify(options || {})}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return cached.data as T;
  }

  // Check if request is already pending (deduplication)
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending as Promise<T>;
  }

  // Make the request
  const requestPromise = (async () => {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the result
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
      
      return data;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
    }
  })();

  // Store as pending
  pendingRequests.set(cacheKey, requestPromise);
  
  return requestPromise as Promise<T>;
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    cacheSize: cache.size,
    pendingRequests: pendingRequests.size,
  };
}
