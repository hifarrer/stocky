import { PolygonBaseClient } from './base';
import {
  TickerDetails,
  TickerSearchParams,
} from '@/types/polygon';
import { PolygonTickerSearch } from '@/types';

export class ReferenceClient extends PolygonBaseClient {
  /**
   * Search for ticker symbols
   */
  async searchTickers(params: TickerSearchParams = {}): Promise<PolygonTickerSearch> {
    const endpoint = '/v3/reference/tickers';
    
    const queryParams = {
      ...params,
      limit: params.limit || 100,
    };

    return this.makeRequest<PolygonTickerSearch>(endpoint, queryParams);
  }

  /**
   * Get detailed information about a specific ticker
   */
  async getTickerDetails(ticker: string, date?: string): Promise<TickerDetails> {
    const validatedTicker = this.validateSymbol(ticker);
    const endpoint = `/v3/reference/tickers/${validatedTicker}`;
    
    const params = date ? { date } : {};
    
    return this.makeRequest<TickerDetails>(endpoint, params);
  }

  /**
   * Search for tickers by name or symbol
   */
  async searchByName(query: string, limit: number = 20): Promise<PolygonTickerSearch> {
    return this.searchTickers({
      search: query,
      active: true,
      limit,
      sort: 'ticker',
      order: 'asc',
    });
  }

  /**
   * Get tickers for a specific market
   */
  async getTickersByMarket(
    market: 'stocks' | 'crypto' | 'fx',
    limit: number = 100
  ): Promise<PolygonTickerSearch> {
    return this.searchTickers({
      market,
      active: true,
      limit,
      sort: 'ticker',
      order: 'asc',
    });
  }

  /**
   * Get popular/trending tickers
   */
  async getPopularTickers(limit: number = 50): Promise<PolygonTickerSearch> {
    return this.searchTickers({
      active: true,
      limit,
      sort: 'ticker',
      order: 'asc',
      market: 'stocks',
    });
  }

  /**
   * Validate if a ticker symbol exists
   */
  async validateTicker(ticker: string): Promise<boolean> {
    try {
      const validatedTicker = this.validateSymbol(ticker);
      const result = await this.searchTickers({
        search: validatedTicker,
        active: true,
        limit: 1,
      });
      
      return result.results.length > 0 && 
             result.results[0].ticker === validatedTicker;
    } catch {
      return false;
    }
  }

  /**
   * Get ticker types for filtering
   */
  async getTickerTypes(): Promise<{ [key: string]: string }> {
    // This would typically come from an endpoint, but Polygon doesn't provide one
    // So we return common types
    return {
      'CS': 'Common Stock',
      'ETF': 'Exchange Traded Fund',
      'ETN': 'Exchange Traded Note',
      'FUND': 'Fund',
      'REIT': 'Real Estate Investment Trust',
      'WARRANT': 'Warrant',
      'RIGHT': 'Right',
      'BOND': 'Bond',
      'NOTE': 'Note',
      'UNIT': 'Unit',
      'PREFERRED': 'Preferred Stock',
    };
  }

  /**
   * Get exchanges list
   */
  async getExchanges(): Promise<{ [key: string]: string }> {
    // Common exchanges - in a real app, this might come from an API
    return {
      'XNYS': 'New York Stock Exchange',
      'XNAS': 'NASDAQ',
      'BATS': 'BATS Global Markets',
      'ARCX': 'NYSE Arca',
      'IEXG': 'IEX',
      'EDGX': 'CBOE EDGX',
      'EDGA': 'CBOE EDGA',
      'BZX': 'CBOE BZX',
      'BYX': 'CBOE BYX',
      'PSX': 'NYSE National',
      'CHX': 'Chicago Stock Exchange',
      'LTSE': 'Long Term Stock Exchange',
      'MEMX': 'Members Exchange',
      'EPRL': 'Emerald',
      'XCHI': 'Chicago Board of Trade',
      'XCME': 'Chicago Mercantile Exchange',
    };
  }
}