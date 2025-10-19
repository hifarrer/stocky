import { PolygonClientConfig, PolygonError } from '@/types/polygon';

export class PolygonBaseClient {
  protected apiKey: string;
  protected baseUrl: string;
  protected timeout: number;
  protected retries: number;
  protected rateLimit: {
    requests: number;
    windowMs: number;
  };

  constructor(config: PolygonClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.polygon.io';
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 3;
    this.rateLimit = config.rateLimit || {
      requests: 5,
      windowMs: 60000, // 1 minute
    };
  }

  protected async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key and other parameters
    url.searchParams.append('apikey', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Stocky-Dashboard/1.0',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited - wait and retry
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (attempt + 1);
            await this.delay(waitTime);
            continue;
          }

          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `HTTP ${response.status}: ${errorData.error || response.statusText}`
          );
        }

        const data = await response.json();
        
        // Check for API-level errors
        if (data.status === 'ERROR') {
          throw new Error(data.error || 'Unknown API error');
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retries) {
          break;
        }

        // Exponential backoff
        await this.delay(1000 * Math.pow(2, attempt));
      }
    }

    throw this.createPolygonError(lastError);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createPolygonError(error: Error): PolygonError {
    if (error.message.includes('429')) {
      return {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        status: 'ERROR',
        request_id: '',
      };
    }

    if (error.message.includes('401')) {
      return {
        error: 'Unauthorized',
        message: 'Invalid API key or insufficient permissions.',
        status: 'ERROR',
        request_id: '',
      };
    }

    if (error.message.includes('404')) {
      return {
        error: 'Not found',
        message: 'The requested resource was not found.',
        status: 'ERROR',
        request_id: '',
      };
    }

    return {
      error: 'Unknown error',
      message: error.message,
      status: 'ERROR',
      request_id: '',
    };
  }

  protected formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  protected validateSymbol(symbol: string): string {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('Symbol is required and must be a string');
    }
    
    return symbol.toUpperCase().trim();
  }

  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return searchParams.toString();
  }
}