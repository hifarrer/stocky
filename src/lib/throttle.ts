/**
 * Request throttling and debouncing utilities
 * Helps prevent too many simultaneous requests
 */

/**
 * Throttle function - ensures function is called at most once per interval
 */
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Debounce function - delays execution until after delay has elapsed since last call
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Request queue to limit concurrent requests
 */
class RequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 6) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const request = this.queue.shift();

    if (request) {
      try {
        await request();
      } finally {
        this.running--;
        this.process();
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getRunningCount(): number {
    return this.running;
  }
}

// Global request queue
export const requestQueue = new RequestQueue(6);

/**
 * Stagger function - delays execution with increasing intervals
 */
export function stagger<T>(
  items: T[],
  callback: (item: T, index: number) => void,
  delayMs: number = 100
): void {
  items.forEach((item, index) => {
    setTimeout(() => {
      callback(item, index);
    }, index * delayMs);
  });
}

/**
 * Rate limiter - limits calls per time window
 */
export class RateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private timeWindow: number;

  constructor(maxCalls: number, timeWindowMs: number) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old calls outside the time window
    this.calls = this.calls.filter(time => now - time < this.timeWindow);
    
    return this.calls.length < this.maxCalls;
  }

  recordRequest(): void {
    this.calls.push(Date.now());
  }

  async waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      const checkSlot = () => {
        if (this.canMakeRequest()) {
          this.recordRequest();
          resolve();
        } else {
          setTimeout(checkSlot, 100);
        }
      };
      checkSlot();
    });
  }
}

// Global rate limiter: 30 requests per 10 seconds
export const globalRateLimiter = new RateLimiter(30, 10000);
