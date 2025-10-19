import { PolygonBaseClient } from './base';
import {
  SnapshotAllTickers,
  SnapshotGainersLosers,
  SnapshotData,
} from '@/types/polygon';

export class SnapshotClient extends PolygonBaseClient {
  /**
   * Get snapshots for all tickers
   */
  async getAllTickers(
    locale: string = 'us',
    market: string = 'stocks'
  ): Promise<SnapshotAllTickers> {
    const endpoint = `/v2/snapshot/locale/${locale}/markets/${market}/tickers`;
    
    return this.makeRequest<SnapshotAllTickers>(endpoint);
  }

  /**
   * Get snapshot for a specific ticker
   */
  async getTicker(ticker: string): Promise<{ results: SnapshotData }> {
    const validatedTicker = this.validateSymbol(ticker);
    const endpoint = `/v2/snapshot/locale/us/markets/stocks/tickers/${validatedTicker}`;
    
    return this.makeRequest<{ results: SnapshotData }>(endpoint);
  }

  /**
   * Get gainers/losers
   */
  async getGainersLosers(
    direction: 'gainers' | 'losers' = 'gainers',
    includeOtc: boolean = false
  ): Promise<SnapshotGainersLosers> {
    const endpoint = `/v2/snapshot/locale/us/markets/stocks/${direction}`;
    
    const params = includeOtc ? { include_otc: true } : {};
    
    return this.makeRequest<SnapshotGainersLosers>(endpoint, params);
  }

  /**
   * Get crypto snapshots
   */
  async getCryptoSnapshots(): Promise<SnapshotAllTickers> {
    const endpoint = '/v2/snapshot/locale/global/markets/crypto/tickers';
    
    return this.makeRequest<SnapshotAllTickers>(endpoint);
  }

  /**
   * Get crypto snapshot for specific ticker
   */
  async getCryptoTicker(ticker: string): Promise<{ results: SnapshotData }> {
    const validatedTicker = this.validateSymbol(ticker);
    const endpoint = `/v2/snapshot/locale/global/markets/crypto/tickers/${validatedTicker}`;
    
    return this.makeRequest<{ results: SnapshotData }>(endpoint);
  }

  /**
   * Get forex snapshots
   */
  async getForexSnapshots(): Promise<SnapshotAllTickers> {
    const endpoint = '/v2/snapshot/locale/global/markets/forex/tickers';
    
    return this.makeRequest<SnapshotAllTickers>(endpoint);
  }

  /**
   * Get snapshot for multiple tickers
   */
  async getMultipleTickers(tickers: string[]): Promise<SnapshotData[]> {
    const validatedTickers = tickers.map(ticker => this.validateSymbol(ticker));
    
    // Make concurrent requests for better performance
    const promises = validatedTickers.map(ticker => 
      this.getTicker(ticker).then(response => response.results)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<SnapshotData> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
    } catch (error) {
      console.error('Error fetching multiple tickers:', error);
      return [];
    }
  }

  /**
   * Get market movers (combination of gainers and losers)
   */
  async getMarketMovers(): Promise<{
    gainers: SnapshotGainersLosers;
    losers: SnapshotGainersLosers;
  }> {
    try {
      const [gainers, losers] = await Promise.all([
        this.getGainersLosers('gainers'),
        this.getGainersLosers('losers'),
      ]);
      
      return { gainers, losers };
    } catch (error) {
      console.error('Error fetching market movers:', error);
      throw error;
    }
  }

  /**
   * Get snapshots with filtering
   */
  async getFilteredSnapshots(options: {
    minVolume?: number;
    minPrice?: number;
    maxPrice?: number;
    sector?: string;
    exchange?: string;
  } = {}): Promise<SnapshotData[]> {
    const allSnapshots = await this.getAllTickers();
    
    if (!allSnapshots.results) {
      return [];
    }

    return allSnapshots.results.filter(snapshot => {
      if (options.minVolume && snapshot.min && snapshot.min.v < options.minVolume) {
        return false;
      }
      
      if (options.minPrice && snapshot.value < options.minPrice) {
        return false;
      }
      
      if (options.maxPrice && snapshot.value > options.maxPrice) {
        return false;
      }
      
      // Additional filtering would require additional data from ticker details
      return true;
    });
  }

  /**
   * Get snapshot with extended data (combines snapshot with previous day data)
   */
  async getExtendedSnapshot(ticker: string): Promise<SnapshotData & {
    extendedData?: {
      volume24h?: number;
      avgVolume?: number;
      marketCap?: number;
      pe?: number;
    };
  }> {
    const snapshot = await this.getTicker(ticker);
    
    // In a real implementation, you might combine this with other API calls
    // to get additional financial metrics
    
    return {
      ...snapshot.results,
      extendedData: {
        volume24h: snapshot.results.min?.v,
        avgVolume: undefined, // Would need historical data
        marketCap: undefined, // Would need company details
        pe: undefined, // Would need financial data
      },
    };
  }

  /**
   * Check if market is open based on snapshot data
   */
  async getMarketStatus(): Promise<{
    isOpen: boolean;
    status: 'open' | 'closed' | 'extended_hours';
    lastUpdated: Date;
  }> {
    try {
      // Get a popular ticker to check market status
      const snapshot = await this.getTicker('AAPL');
      
      return {
        isOpen: snapshot.results.market_status === 'open',
        status: snapshot.results.market_status,
        lastUpdated: new Date(snapshot.results.updated),
      };
    } catch (error) {
      // Fallback to basic time-based check
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Simple market hours check (Eastern Time assumption)
      // In production, you'd want proper timezone handling
      const isWeekday = day >= 1 && day <= 5;
      const isDuringMarketHours = hour >= 9 && hour < 16;
      
      return {
        isOpen: isWeekday && isDuringMarketHours,
        status: isWeekday && isDuringMarketHours ? 'open' : 'closed',
        lastUpdated: now,
      };
    }
  }
}