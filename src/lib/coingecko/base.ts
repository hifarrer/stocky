export interface CoinGeckoConfig {
  apiKey?: string;
  apiKeyType?: 'demo' | 'pro';
  baseUrl?: string;
  timeout?: number;
  usePro?: boolean; // Explicit flag to use Pro API
}

export interface CoinGeckoError {
  error: string;
  message: string;
  status: 'ERROR';
}

export class CoinGeckoBaseClient {
  protected apiKey?: string;
  protected apiKeyType: 'demo' | 'pro';
  protected baseUrl: string;
  protected timeout: number;
  protected usePro: boolean;

  constructor(config: CoinGeckoConfig = {}) {
    this.apiKey = config.apiKey;
    this.usePro = config.usePro || false;
    // Determine key type for header selection
    this.apiKeyType = config.apiKeyType || this.detectKeyType(config.apiKey);
    // Set base URL - default to standard URL unless explicitly set to Pro
    this.baseUrl = config.baseUrl || this.getBaseUrl(this.usePro);
    this.timeout = config.timeout || 10000;
  }

  private detectKeyType(apiKey?: string): 'demo' | 'pro' {
    if (!apiKey) return 'demo';
    // Both Demo and Pro keys can start with 'CG-'
    // Default to 'demo' for header selection - will use x-cg-demo-api-key
    // The base URL is controlled by usePro flag, not this detection
    return 'demo';
  }

  private getBaseUrl(usePro: boolean): string {
    // Only use Pro URL if explicitly configured
    if (usePro) {
      return 'https://pro-api.coingecko.com/api/v3';
    }
    // Default to standard URL for free tier and Demo keys
    return 'https://api.coingecko.com/api/v3';
  }

  protected async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const headers: HeadersInit = {
        'Accept': 'application/json',
      };

      // Add API key in header if provided
      if (this.apiKey) {
        // Use Pro header only if explicitly configured as Pro
        const headerName = this.usePro ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';
        headers[headerName] = this.apiKey;
        console.log('CoinGecko API: Using API key with header:', headerName, 'and base URL:', this.baseUrl);
      } else {
        console.log('CoinGecko API: Using free tier (no API key)');
      }

      console.log('CoinGecko API Request:', url.toString());

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      console.log('CoinGecko API Response Status:', response.status);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }

        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your NEXT_PUBLIC_COINGECKO_API_KEY.');
        }

        const errorData = await response.json().catch(() => ({}));
        console.error('CoinGecko API Error:', errorData);
        
        const errorMessage = errorData.status?.error_message || errorData.error || response.statusText;
        throw new Error(
          `HTTP ${response.status}: ${errorMessage}`
        );
      }

      const data = await response.json();
      console.log('CoinGecko API Success:', Object.keys(data));
      return data as T;
    } catch (error) {
      console.error('CoinGecko API Request Failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred');
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Search for cryptocurrencies, exchanges, and categories
   */
  async search(query: string): Promise<{
    coins: Array<{
      id: string;
      name: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      large: string;
    }>;
    exchanges: Array<{
      id: string;
      name: string;
      market_type: string;
      thumb: string;
      large: string;
    }>;
    categories: Array<{
      id: number;
      name: string;
    }>;
  }> {
    return this.makeRequest('/search', { query });
  }
}

