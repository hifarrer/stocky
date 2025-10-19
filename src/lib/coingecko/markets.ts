import { CoinGeckoBaseClient } from './base';

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CoinGeckoMarketParams {
  vs_currency?: string;
  ids?: string;
  category?: string;
  order?: 'market_cap_desc' | 'market_cap_asc' | 'volume_desc' | 'volume_asc' | 'id_desc' | 'id_asc';
  per_page?: number;
  page?: number;
  sparkline?: boolean;
  price_change_percentage?: string;
}

export class MarketsClient extends CoinGeckoBaseClient {
  /**
   * Get cryptocurrency market data
   */
  async getMarkets(params: CoinGeckoMarketParams = {}): Promise<CoinMarketData[]> {
    const defaultParams = {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 100,
      page: 1,
      sparkline: false,
      price_change_percentage: '24h',
      ...params,
    };

    return this.makeRequest<CoinMarketData[]>('/coins/markets', defaultParams);
  }

  /**
   * Get top gainers in the last 24h
   */
  async getTopGainers(limit: number = 20): Promise<CoinMarketData[]> {
    const data = await this.getMarkets({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 250, // Get more to filter from
      page: 1,
    });

    // Filter and sort by positive price changes
    return data
      .filter(coin => coin.price_change_percentage_24h > 0)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, limit);
  }

  /**
   * Get top losers in the last 24h
   */
  async getTopLosers(limit: number = 20): Promise<CoinMarketData[]> {
    const data = await this.getMarkets({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 250, // Get more to filter from
      page: 1,
    });

    // Filter and sort by negative price changes
    return data
      .filter(coin => coin.price_change_percentage_24h < 0)
      .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, limit);
  }

  /**
   * Get market data for specific coins
   */
  async getCoinsByIds(coinIds: string[]): Promise<CoinMarketData[]> {
    return this.getMarkets({
      ids: coinIds.join(','),
      vs_currency: 'usd',
    });
  }

  /**
   * Get trending coins
   */
  async getTrending(): Promise<{
    coins: Array<{
      item: {
        id: string;
        coin_id: number;
        name: string;
        symbol: string;
        market_cap_rank: number;
        thumb: string;
        small: string;
        large: string;
        slug: string;
        price_btc: number;
        score: number;
      };
    }>;
  }> {
    return this.makeRequest('/search/trending');
  }

  /**
   * Get global cryptocurrency data
   */
  async getGlobal(): Promise<{
    data: {
      active_cryptocurrencies: number;
      upcoming_icos: number;
      ongoing_icos: number;
      ended_icos: number;
      markets: number;
      total_market_cap: Record<string, number>;
      total_volume: Record<string, number>;
      market_cap_percentage: Record<string, number>;
      market_cap_change_percentage_24h_usd: number;
      updated_at: number;
    };
  }> {
    return this.makeRequest('/global');
  }
}

