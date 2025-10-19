import { PolygonBaseClient } from './base';
import { TickerNews, NewsParams } from '@/types/polygon';
import { NewsArticle } from '@/types';

export class NewsClient extends PolygonBaseClient {
  /**
   * Get news articles
   */
  async getNews(params: NewsParams = {}): Promise<TickerNews> {
    const endpoint = '/v2/reference/news';
    
    const queryParams = {
      ...params,
      limit: params.limit || 100,
      sort: params.sort || 'published_utc',
      order: params.order || 'desc',
    };

    return this.makeRequest<TickerNews>(endpoint, queryParams);
  }

  /**
   * Get news for a specific ticker
   */
  async getTickerNews(
    ticker: string,
    limit: number = 50,
    daysBack: number = 7
  ): Promise<NewsArticle[]> {
    const validatedTicker = this.validateSymbol(ticker);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    
    const response = await this.getNews({
      ticker: validatedTicker,
      limit,
      'published_utc.gte': fromDate.toISOString().split('T')[0],
      sort: 'published_utc',
      order: 'desc',
    });

    return this.transformNewsResponse(response);
  }

  /**
   * Get latest market news (all tickers)
   */
  async getLatestNews(limit: number = 100): Promise<NewsArticle[]> {
    const response = await this.getNews({
      limit,
      sort: 'published_utc',
      order: 'desc',
    });

    return this.transformNewsResponse(response);
  }

  /**
   * Get news from the last N hours
   */
  async getRecentNews(
    hours: number = 24,
    limit: number = 100
  ): Promise<NewsArticle[]> {
    const fromDate = new Date();
    fromDate.setHours(fromDate.getHours() - hours);
    
    const response = await this.getNews({
      'published_utc.gte': fromDate.toISOString(),
      limit,
      sort: 'published_utc',
      order: 'desc',
    });

    return this.transformNewsResponse(response);
  }

  /**
   * Get news for multiple tickers
   */
  async getMultiTickerNews(
    tickers: string[],
    limit: number = 20,
    daysBack: number = 7
  ): Promise<{ [ticker: string]: NewsArticle[] }> {
    const validatedTickers = tickers.map(ticker => this.validateSymbol(ticker));
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    
    const promises = validatedTickers.map(async ticker => {
      try {
        const news = await this.getTickerNews(ticker, limit, daysBack);
        return { ticker, news };
      } catch (error) {
        console.error(`Error fetching news for ${ticker}:`, error);
        return { ticker, news: [] };
      }
    });

    const results = await Promise.allSettled(promises);
    const newsMap: { [ticker: string]: NewsArticle[] } = {};

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        newsMap[result.value.ticker] = result.value.news;
      }
    });

    return newsMap;
  }

  /**
   * Search news by keywords
   */
  async searchNews(
    keywords: string[],
    limit: number = 100,
    daysBack: number = 30
  ): Promise<NewsArticle[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);
    
    const response = await this.getNews({
      'published_utc.gte': fromDate.toISOString().split('T')[0],
      limit: limit * 2, // Get more to filter
      sort: 'published_utc',
      order: 'desc',
    });

    const news = this.transformNewsResponse(response);
    
    // Filter by keywords
    const keywordRegex = new RegExp(keywords.join('|'), 'i');
    
    return news
      .filter(article => 
        keywordRegex.test(article.title) || 
        keywordRegex.test(article.description) ||
        article.keywords.some(keyword => keywordRegex.test(keyword))
      )
      .slice(0, limit);
  }

  /**
   * Get trending news (high engagement or multiple tickers)
   */
  async getTrendingNews(limit: number = 50): Promise<NewsArticle[]> {
    const response = await this.getNews({
      limit: limit * 2,
      sort: 'published_utc',
      order: 'desc',
    });

    const news = this.transformNewsResponse(response);
    
    // Sort by number of tickers mentioned (proxy for importance)
    return news
      .sort((a, b) => (b.tickers?.length || 0) - (a.tickers?.length || 0))
      .slice(0, limit);
  }

  /**
   * Get sentiment analysis for news
   */
  async getNewsSentiment(
    ticker: string,
    daysBack: number = 7
  ): Promise<{
    overall: 'positive' | 'negative' | 'neutral';
    positive: number;
    negative: number;
    neutral: number;
    total: number;
  }> {
    const news = await this.getTickerNews(ticker, 100, daysBack);
    
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    news.forEach(article => {
      if (article.insights) {
        const tickerInsight = article.insights.find(
          insight => insight.ticker.toUpperCase() === ticker.toUpperCase()
        );
        
        if (tickerInsight) {
          switch (tickerInsight.sentiment) {
            case 'positive':
              positive++;
              break;
            case 'negative':
              negative++;
              break;
            default:
              neutral++;
          }
        } else {
          neutral++;
        }
      } else {
        neutral++;
      }
    });

    const total = positive + negative + neutral;
    let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (positive > negative && positive > neutral) {
      overall = 'positive';
    } else if (negative > positive && negative > neutral) {
      overall = 'negative';
    }

    return {
      overall,
      positive,
      negative,
      neutral,
      total,
    };
  }

  /**
   * Get news categories/topics
   */
  async getNewsCategories(limit: number = 100): Promise<{ [category: string]: number }> {
    const response = await this.getNews({ limit });
    const news = this.transformNewsResponse(response);
    
    const categories: { [category: string]: number } = {};
    
    news.forEach(article => {
      article.keywords.forEach(keyword => {
        const category = keyword.toLowerCase();
        categories[category] = (categories[category] || 0) + 1;
      });
    });

    // Sort by frequency
    const sortedCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as { [category: string]: number });

    return sortedCategories;
  }

  /**
   * Transform Polygon news response to our NewsArticle type
   */
  private transformNewsResponse(response: TickerNews): NewsArticle[] {
    if (!response.results) {
      return [];
    }

    return response.results.map(article => ({
      id: article.id,
      publisher: article.publisher,
      title: article.title,
      author: article.author,
      published_utc: article.published_utc,
      article_url: article.article_url,
      tickers: article.tickers,
      image_url: article.image_url,
      description: article.description,
      keywords: article.keywords,
      insights: article.insights,
    }));
  }

  /**
   * Get news feed with mixed content (latest + ticker-specific)
   */
  async getNewsFeed(
    watchlistTickers: string[] = [],
    limit: number = 50
  ): Promise<NewsArticle[]> {
    const promises: Promise<NewsArticle[]>[] = [
      this.getLatestNews(Math.floor(limit * 0.6)), // 60% general news
    ];

    if (watchlistTickers.length > 0) {
      // 40% ticker-specific news distributed among watchlist
      const tickerLimit = Math.floor((limit * 0.4) / watchlistTickers.length);
      
      watchlistTickers.forEach(ticker => {
        promises.push(
          this.getTickerNews(ticker, tickerLimit, 3).catch(() => [])
        );
      });
    }

    const results = await Promise.allSettled(promises);
    const allNews: NewsArticle[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    });

    // Remove duplicates and sort by date
    const uniqueNews = allNews.filter((article, index, self) =>
      index === self.findIndex(a => a.id === article.id)
    );

    return uniqueNews
      .sort((a, b) => new Date(b.published_utc).getTime() - new Date(a.published_utc).getTime())
      .slice(0, limit);
  }
}