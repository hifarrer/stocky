import { PolygonClientConfig } from '@/types/polygon';
import { SnapshotData } from '@/types';
import { ReferenceClient } from './reference';
import { SnapshotClient } from './snapshot';
import { HistoricalClient } from './historical';
import { NewsClient } from './news';
import { PolygonWebSocketClient, WebSocketClientConfig, WebSocketEventHandlers } from './websocket';

export class PolygonClient {
  public reference: ReferenceClient;
  public snapshot: SnapshotClient;
  public historical: HistoricalClient;
  public news: NewsClient;
  private wsConfig: WebSocketClientConfig;

  constructor(config: PolygonClientConfig) {
    // Initialize REST API clients
    this.reference = new ReferenceClient(config);
    this.snapshot = new SnapshotClient(config);
    this.historical = new HistoricalClient(config);
    this.news = new NewsClient(config);

    // Store WebSocket config for later use
    this.wsConfig = {
      apiKey: config.apiKey,
      wsUrl: config.websocketUrl || 'wss://socket.polygon.io/stocks',
    };
  }

  /**
   * Create a WebSocket client instance
   */
  createWebSocketClient(handlers: WebSocketEventHandlers = {}): PolygonWebSocketClient {
    return new PolygonWebSocketClient(this.wsConfig, handlers);
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.reference.searchTickers({ limit: 1 });
      return result.status === 'OK';
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get comprehensive market overview
   */
  async getMarketOverview(): Promise<{
    gainers: Record<string, unknown>[];
    losers: Record<string, unknown>[];
    mostActive: Record<string, unknown>[];
    indices: Record<string, unknown>[];
    cryptos: Record<string, unknown>[];
  }> {
    try {
      const [movers, cryptoSnapshots] = await Promise.allSettled([
        this.snapshot.getMarketMovers(),
        this.snapshot.getCryptoSnapshots(),
      ]);

      const gainers = movers.status === 'fulfilled' ? movers.value.gainers.results?.slice(0, 10) || [] : [];
      const losers = movers.status === 'fulfilled' ? movers.value.losers.results?.slice(0, 10) || [] : [];
      const cryptos = cryptoSnapshots.status === 'fulfilled' ? cryptoSnapshots.value.results?.slice(0, 10) || [] : [];

      // Get major indices (these would typically be predefined)
      const majorIndices = ['SPY', 'QQQ', 'IWM', 'DIA'];
      const indicesData = await Promise.allSettled(
        majorIndices.map(ticker => this.snapshot.getTicker(ticker))
      );

      const indices = indicesData
        .filter((result): result is PromiseFulfilledResult<{ results: SnapshotData }> => result.status === 'fulfilled')
        .map(result => result.value.results);

      // Most active would need volume data - using gainers as proxy
      const mostActive = gainers.slice(0, 10);

      return {
        gainers,
        losers,
        mostActive,
        indices: indices as unknown as Record<string, unknown>[],
        cryptos,
      };
    } catch (error) {
      console.error('Error fetching market overview:', error);
      return {
        gainers: [],
        losers: [],
        mostActive: [],
        indices: [],
        cryptos: [],
      };
    }
  }

  /**
   * Get complete ticker data (snapshot + details + news)
   */
  async getCompleteTickerData(ticker: string): Promise<{
    snapshot: Record<string, unknown>;
    details: Record<string, unknown>;
    news: Record<string, unknown>[];
    historical: Record<string, unknown>;
  }> {
    const validatedTicker = ticker.toUpperCase().trim();

    try {
      const [snapshot, details, news, historical] = await Promise.allSettled([
        this.snapshot.getTicker(validatedTicker),
        this.reference.getTickerDetails(validatedTicker),
        this.news.getTickerNews(validatedTicker, 10, 7),
        this.historical.getDailyData(validatedTicker, 30),
      ]);

      return {
        snapshot: snapshot.status === 'fulfilled' ? snapshot.value.results as unknown as Record<string, unknown> : {},
        details: details.status === 'fulfilled' ? details.value.results as unknown as Record<string, unknown> : {},
        news: news.status === 'fulfilled' ? news.value as unknown as Record<string, unknown>[] : [],
        historical: historical.status === 'fulfilled' ? historical.value as unknown as Record<string, unknown> : {},
      };
    } catch (error) {
      console.error(`Error fetching complete data for ${validatedTicker}:`, error);
      throw error;
    }
  }

  /**
   * Search for tickers with enhanced results
   */
  async searchTickersEnhanced(query: string, limit: number = 20): Promise<{
    stocks: Record<string, unknown>[];
    cryptos: Record<string, unknown>[];
    forex: Record<string, unknown>[];
  }> {
    try {
      const [stocks, cryptos, forex] = await Promise.allSettled([
        this.reference.searchTickers({
          search: query,
          market: 'stocks',
          active: true,
          limit,
        }),
        this.reference.searchTickers({
          search: query,
          market: 'crypto',
          active: true,
          limit,
        }),
        this.reference.searchTickers({
          search: query,
          market: 'fx',
          active: true,
          limit,
        }),
      ]);

      return {
        stocks: stocks.status === 'fulfilled' ? stocks.value.results || [] : [],
        cryptos: cryptos.status === 'fulfilled' ? cryptos.value.results || [] : [],
        forex: forex.status === 'fulfilled' ? forex.value.results || [] : [],
      };
    } catch (error) {
      console.error('Error in enhanced ticker search:', error);
      return {
        stocks: [],
        cryptos: [],
        forex: [],
      };
    }
  }

  /**
   * Get trending tickers based on news mentions
   */
  async getTrendingTickers(limit: number = 20): Promise<{
    ticker: string;
    mentions: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[]> {
    try {
      const recentNews = await this.news.getRecentNews(24, 200);
      const tickerMentions: { [ticker: string]: { count: number; sentiments: string[] } } = {};

      recentNews.forEach(article => {
        article.tickers.forEach(ticker => {
          if (!tickerMentions[ticker]) {
            tickerMentions[ticker] = { count: 0, sentiments: [] };
          }
          tickerMentions[ticker].count++;
          
          // Add sentiment if available
          const insight = article.insights?.find(i => i.ticker === ticker);
          if (insight) {
            tickerMentions[ticker].sentiments.push(insight.sentiment);
          }
        });
      });

      // Sort by mention count and calculate overall sentiment
      const trending = Object.entries(tickerMentions)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, limit)
        .map(([ticker, data]) => {
          // Calculate overall sentiment
          const sentimentCounts = data.sentiments.reduce((acc, sentiment) => {
            acc[sentiment] = (acc[sentiment] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });

          let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
          const maxSentiment = Object.entries(sentimentCounts)
            .sort(([, a], [, b]) => b - a)[0];
          
          if (maxSentiment) {
            overallSentiment = maxSentiment[0] as 'positive' | 'negative' | 'neutral';
          }

          return {
            ticker,
            mentions: data.count,
            sentiment: overallSentiment,
          };
        });

      return trending;
    } catch (error) {
      console.error('Error getting trending tickers:', error);
      return [];
    }
  }
}

// Export individual clients for direct use if needed
export {
  ReferenceClient,
  SnapshotClient,
  HistoricalClient,
  NewsClient,
  PolygonWebSocketClient,
};

// Export types
export type {
  PolygonClientConfig,
  WebSocketClientConfig,
  WebSocketEventHandlers,
};

// Create a default client instance factory
export function createPolygonClient(apiKey: string, options: Partial<PolygonClientConfig> = {}): PolygonClient {
  const config: PolygonClientConfig = {
    apiKey,
    baseUrl: 'https://api.polygon.io',
    websocketUrl: 'wss://socket.polygon.io/stocks',
    timeout: 10000,
    retries: 3,
    rateLimit: {
      requests: 5,
      windowMs: 60000,
    },
    ...options,
  };

  return new PolygonClient(config);
}