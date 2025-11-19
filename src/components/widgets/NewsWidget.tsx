'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, Clock, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSymbol, useWatchlist } from '@/contexts';
import { NewsArticle } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NewsWidgetProps {
  maxArticles?: number;
  showImages?: boolean;
  className?: string;
}

export function NewsWidget({ 
  maxArticles = 10, 
  showImages = false,
  className 
}: NewsWidgetProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showTickerNews, setShowTickerNews] = useState(false);

  const { selectedSymbol } = useSymbol();
  const { watchlist } = useWatchlist();

  // Fetch news based on current mode
  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let url = `/api/news?limit=${maxArticles}`;
      
      if (showTickerNews && selectedSymbol) {
        // Get news for selected symbol
        url += `&ticker=${encodeURIComponent(selectedSymbol.symbol)}&days=7`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch news');
      }

      const articles: NewsArticle[] = data.data || [];
      setNews(articles);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setIsLoading(false);
    }
  };

  // Load news on mount and when dependencies change
  useEffect(() => {
    fetchNews();
    
    // No auto-refresh to reduce client load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTickerNews, selectedSymbol, watchlist, maxArticles]);

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-danger';
      default:
        return 'text-muted-foreground';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-3 w-3" />;
      case 'negative':
        return <TrendingUp className="h-3 w-3 rotate-180" />;
      default:
        return null;
    }
  };

  const handleArticleClick = (article: NewsArticle) => {
    window.open(article.article_url, '_blank', 'noopener,noreferrer');
  };

  const getRelatedTicker = (article: NewsArticle) => {
    if (selectedSymbol && article.tickers.includes(selectedSymbol.symbol)) {
      return selectedSymbol.symbol;
    }
    
    // Find first ticker in watchlist
    const watchlistTicker = article.tickers.find(ticker => 
      watchlist.includes(ticker)
    );
    
    return watchlistTicker || article.tickers[0];
  };

  const getTickerSentiment = (article: NewsArticle, ticker: string) => {
    return article.insights?.find(insight => 
      insight.ticker.toUpperCase() === ticker.toUpperCase()
    )?.sentiment;
  };

  if (isLoading && news.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading news...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("h-full flex items-center justify-center text-destructive", className)}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1">Error loading news</div>
          <div className="text-xs mb-2">{error}</div>
          <Button variant="outline" size="sm" onClick={fetchNews}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">
            {showTickerNews && selectedSymbol 
              ? `${selectedSymbol.symbol} News` 
              : 'Market News'
            }
          </h3>
          <Badge variant="outline" className="text-xs">
            {news.length} articles
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          {selectedSymbol && (
            <Button
              variant={showTickerNews ? "default" : "ghost"}
              size="sm"
              className="text-xs h-6"
              onClick={() => setShowTickerNews(!showTickerNews)}
            >
              <Eye className="h-3 w-3 mr-1" />
              {selectedSymbol.symbol}
            </Button>
          )}
          
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {format(lastUpdated, 'HH:mm')}
            </span>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchNews}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {news.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-sm font-medium mb-1">No News Available</div>
              <div className="text-xs">
                {showTickerNews && selectedSymbol
                  ? `No recent news for ${selectedSymbol.symbol}`
                  : 'No market news available'
                }
              </div>
            </div>
          </div>
        ) : (
          news.map((article, index) => {
            const relatedTicker = getRelatedTicker(article);
            const sentiment = getTickerSentiment(article, relatedTicker);
            const publishedDate = new Date(article.published_utc);
            
            return (
              <div
                key={`${article.id}-${index}`}
                className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleArticleClick(article)}
              >
                <div className="flex items-start gap-3">
                  {/* Article Image */}
                  {showImages && article.image_url && (
                    <div className="w-16 h-16 rounded overflow-hidden shrink-0">
                      <img
                        src={article.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {/* Header with tickers and sentiment */}
                    <div className="flex items-center gap-2 mb-1">
                      {relatedTicker && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            getSentimentColor(sentiment)
                          )}
                        >
                          <span>{relatedTicker}</span>
                          {getSentimentIcon(sentiment) && (
                            <span className="ml-1">
                              {getSentimentIcon(sentiment)}
                            </span>
                          )}
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(publishedDate, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h4 className="text-sm font-medium line-clamp-2 mb-1">
                      {article.title}
                    </h4>
                    
                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {article.description}
                    </p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {article.publisher.name}
                        </span>
                        
                        {article.tickers.length > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            +{article.tickers.length - 1} more
                          </Badge>
                        )}
                      </div>
                      
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-success" />
              <span>Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-danger" />
              <span>Negative</span>
            </div>
          </div>
          <div>Click to read full article</div>
        </div>
      </div>
    </div>
  );
}