import { PolygonBaseClient } from './base';
import {
  AggregatesResponse,
  PreviousCloseResponse,
  AggregatesParams,
} from '@/types/polygon';
import { TimeFrame } from '@/types';

export class HistoricalClient extends PolygonBaseClient {
  /**
   * Get aggregated price data (OHLCV) for a ticker
   */
  async getAggregates(params: AggregatesParams): Promise<AggregatesResponse> {
    const validatedTicker = this.validateSymbol(params.ticker);
    const endpoint = `/v2/aggs/ticker/${validatedTicker}/range/${params.multiplier}/${params.timespan}/${params.from}/${params.to}`;
    
    const queryParams = {
      adjusted: params.adjusted !== false, // Default to true
      sort: params.sort || 'asc',
      limit: params.limit || 5000,
    };

    return this.makeRequest<AggregatesResponse>(endpoint, queryParams);
  }

  /**
   * Get previous trading day's data
   */
  async getPreviousClose(ticker: string, adjusted: boolean = true): Promise<PreviousCloseResponse> {
    const validatedTicker = this.validateSymbol(ticker);
    const endpoint = `/v2/aggs/ticker/${validatedTicker}/prev`;
    
    const params = { adjusted };
    
    return this.makeRequest<PreviousCloseResponse>(endpoint, params);
  }

  /**
   * Get historical data for a specific timeframe
   */
  async getHistoricalData(
    ticker: string,
    timeframe: TimeFrame,
    from: Date,
    to: Date = new Date(),
    adjusted: boolean = true
  ): Promise<AggregatesResponse> {
    const { multiplier, timespan } = this.parseTimeframe(timeframe);
    
    return this.getAggregates({
      ticker,
      multiplier,
      timespan: timespan as 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
      from: this.formatDate(from),
      to: this.formatDate(to),
      adjusted,
      sort: 'asc',
    });
  }

  /**
   * Get chart data for different timeframes
   */
  async getChartData(
    ticker: string,
    timeframe: TimeFrame,
    period: number = 30 // days
  ): Promise<AggregatesResponse> {
    const to = new Date();
    const from = new Date();
    
    // Calculate the 'from' date based on timeframe and period
    switch (timeframe) {
      case '1m':
      case '5m':
      case '15m':
        from.setHours(from.getHours() - period);
        break;
      case '1h':
      case '4h':
        from.setDate(from.getDate() - period);
        break;
      case '1d':
        from.setDate(from.getDate() - period);
        break;
      case '1w':
        from.setDate(from.getDate() - (period * 7));
        break;
      case '1M':
        from.setMonth(from.getMonth() - period);
        break;
      default:
        from.setDate(from.getDate() - 30);
    }

    return this.getHistoricalData(ticker, timeframe, from, to);
  }

  /**
   * Get daily data for the last N trading days
   */
  async getDailyData(
    ticker: string,
    days: number = 100,
    adjusted: boolean = true
  ): Promise<AggregatesResponse> {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (days * 1.5)); // Account for weekends
    
    return this.getAggregates({
      ticker,
      multiplier: 1,
      timespan: 'day',
      from: this.formatDate(from),
      to: this.formatDate(to),
      adjusted,
      sort: 'asc',
      limit: days,
    });
  }

  /**
   * Get weekly data
   */
  async getWeeklyData(
    ticker: string,
    weeks: number = 52,
    adjusted: boolean = true
  ): Promise<AggregatesResponse> {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (weeks * 7));
    
    return this.getAggregates({
      ticker,
      multiplier: 1,
      timespan: 'week',
      from: this.formatDate(from),
      to: this.formatDate(to),
      adjusted,
      sort: 'asc',
    });
  }

  /**
   * Get monthly data
   */
  async getMonthlyData(
    ticker: string,
    months: number = 24,
    adjusted: boolean = true
  ): Promise<AggregatesResponse> {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    
    return this.getAggregates({
      ticker,
      multiplier: 1,
      timespan: 'month',
      from: this.formatDate(from),
      to: this.formatDate(to),
      adjusted,
      sort: 'asc',
    });
  }

  /**
   * Get intraday data (minute-level)
   */
  async getIntradayData(
    ticker: string,
    multiplier: number = 1,
    date?: Date
  ): Promise<AggregatesResponse> {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);
    
    return this.getAggregates({
      ticker,
      multiplier,
      timespan: 'minute',
      from: dateStr,
      to: dateStr,
      adjusted: true,
      sort: 'asc',
    });
  }

  /**
   * Get price range data (high/low over period)
   */
  async getPriceRange(
    ticker: string,
    days: number = 52 * 7 // 1 year
  ): Promise<{ high: number; low: number; current?: number }> {
    const data = await this.getDailyData(ticker, days);
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No data available for price range calculation');
    }

    const high = Math.max(...data.results.map(bar => bar.h));
    const low = Math.min(...data.results.map(bar => bar.l));
    const current = data.results[data.results.length - 1]?.c;

    return { high, low, current };
  }

  /**
   * Calculate simple moving average
   */
  async getMovingAverage(
    ticker: string,
    period: number = 20,
    timeframe: TimeFrame = '1d'
  ): Promise<number[]> {
    const data = await this.getChartData(ticker, timeframe, period * 2);
    
    if (!data.results || data.results.length < period) {
      return [];
    }

    const movingAverages: number[] = [];
    
    for (let i = period - 1; i < data.results.length; i++) {
      const sum = data.results
        .slice(i - period + 1, i + 1)
        .reduce((acc, bar) => acc + bar.c, 0);
      
      movingAverages.push(sum / period);
    }

    return movingAverages;
  }

  /**
   * Get volatility data
   */
  async getVolatility(
    ticker: string,
    days: number = 30
  ): Promise<{ volatility: number; averageVolume: number }> {
    const data = await this.getDailyData(ticker, days);
    
    if (!data.results || data.results.length < 2) {
      throw new Error('Insufficient data for volatility calculation');
    }

    // Calculate daily returns
    const returns: number[] = [];
    for (let i = 1; i < data.results.length; i++) {
      const prevClose = data.results[i - 1].c;
      const currentClose = data.results[i].c;
      returns.push((currentClose - prevClose) / prevClose);
    }

    // Calculate standard deviation (volatility)
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility

    // Calculate average volume
    const averageVolume = data.results.reduce((sum, bar) => sum + bar.v, 0) / data.results.length;

    return { volatility, averageVolume };
  }

  /**
   * Parse timeframe string into multiplier and timespan
   */
  private parseTimeframe(timeframe: TimeFrame): { multiplier: number; timespan: string } {
    switch (timeframe) {
      case '1m':
        return { multiplier: 1, timespan: 'minute' };
      case '5m':
        return { multiplier: 5, timespan: 'minute' };
      case '15m':
        return { multiplier: 15, timespan: 'minute' };
      case '1h':
        return { multiplier: 1, timespan: 'hour' };
      case '4h':
        return { multiplier: 4, timespan: 'hour' };
      case '1d':
        return { multiplier: 1, timespan: 'day' };
      case '1w':
        return { multiplier: 1, timespan: 'week' };
      case '1M':
        return { multiplier: 1, timespan: 'month' };
      default:
        return { multiplier: 1, timespan: 'day' };
    }
  }
}