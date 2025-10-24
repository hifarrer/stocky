/**
 * Optimized API utilities with caching and rate limiting
 */

import { cachedFetch, CacheTTL } from './cache';
import { requestQueue, globalRateLimiter } from './throttle';

// Re-export cache utilities for convenience
export { CacheTTL, apiCache } from './cache';
export { throttle, debounce } from './throttle';

/**
 * Fetch with all optimizations applied
 * - Caching to reduce duplicate requests
 * - Request queuing to limit concurrency
 * - Rate limiting to prevent flooding
 */
export async function optimizedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheTTL: number = CacheTTL.MEDIUM
): Promise<T> {
  // Wait for rate limiter
  await globalRateLimiter.waitForSlot();

  // Use request queue to limit concurrent requests
  return requestQueue.add(async () => {
    return cachedFetch<T>(url, options, cacheTTL);
  });
}

/**
 * Batch multiple API requests with optimizations
 * Returns results in the same order as requests
 */
export async function batchFetch<T>(
  requests: Array<{
    url: string;
    options?: RequestInit;
    cacheTTL?: number;
  }>
): Promise<T[]> {
  const promises = requests.map((req) =>
    optimizedFetch<T>(req.url, req.options, req.cacheTTL)
  );
  
  return Promise.all(promises);
}

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  maxRetries: number = 3,
  retryDelay: number = 1000,
  cacheTTL: number = CacheTTL.MEDIUM
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await optimizedFetch<T>(url, options, cacheTTL);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain status codes
      if (error instanceof Error && error.message.includes('404')) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

/**
 * Polling with optimization
 * Returns a cleanup function to stop polling
 */
export function startOptimizedPolling(
  callback: () => Promise<void>,
  intervalMs: number,
  immediate: boolean = true
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      await callback();
    } catch (error) {
      console.error('Polling error:', error);
    }

    if (isActive) {
      timeoutId = setTimeout(poll, intervalMs);
    }
  };

  if (immediate) {
    poll();
  } else {
    timeoutId = setTimeout(poll, intervalMs);
  }

  // Return cleanup function
  return () => {
    isActive = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}
