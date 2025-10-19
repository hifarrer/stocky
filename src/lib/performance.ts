import { useState, useEffect, useRef } from 'react';

// Debounce hook for search inputs and API calls
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttle hook for frequent events like scrolling or resizing
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  return throttledValue;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = '0%',
    freezeOnceVisible = false,
  }: {
    threshold?: number;
    root?: Element | null;
    rootMargin?: string;
    freezeOnceVisible?: boolean;
  } = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        if (!freezeOnceVisible || !isIntersecting) {
          setIsIntersecting(isElementIntersecting);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible, isIntersecting]);

  return isIntersecting;
}

// Local storage hook with serialization
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key \"${key}\":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key \"${key}\":`, error);
    }
  };

  return [storedValue, setValue];
}

// Memory usage monitoring hook
export function useMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} {
  const [memory, setMemory] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const memInfo = (performance as Record<string, unknown>).memory as Record<string, number>;
        setMemory({
          usedJSHeapSize: memInfo.usedJSHeapSize,
          totalJSHeapSize: memInfo.totalJSHeapSize,
          jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memory;
}

// Previous value hook for change detection
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// Async data fetching hook with caching
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = [],
  options: {
    cacheKey?: string;
    cacheTime?: number;
    onError?: (error: Error) => void;
  } = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { cacheKey, cacheTime = 5 * 60 * 1000, onError } = options;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (cacheKey) {
        const cached = getCachedData<T>(cacheKey);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      const result = await fetcher();
      setData(result);

      // Cache the result
      if (cacheKey) {
        setCachedData(cacheKey, result, cacheTime);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}

// Simple in-memory cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now > entry.timestamp + entry.ttl) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Performance measurement utilities
export function measurePerformance(name: string, fn: () => void | Promise<void>): void {
  const start = performance.now();
  
  const measure = () => {
    const end = performance.now();
    console.log(`[Performance] ${name}: ${end - start}ms`);
  };

  const result = fn();
  
  if (result instanceof Promise) {
    result.finally(measure);
  } else {
    measure();
  }
}

// Bundle size analyzer (development only)
export function analyzeBundleSize(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analyzer would run in real webpack setup');
  }
}