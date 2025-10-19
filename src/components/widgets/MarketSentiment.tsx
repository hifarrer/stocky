'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SentimentIndicator {
  name: string;
  value: number; // 0-100 scale
  change: number;
  description: string;
  status: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
}

interface MarketSentimentProps {
  className?: string;
}

export function MarketSentiment({ className = '' }: MarketSentimentProps) {
  const [fearGreedIndex, setFearGreedIndex] = useState<number>(50);
  const [indicators, setIndicators] = useState<SentimentIndicator[]>([]);
  const [marketBreadth, setMarketBreadth] = useState({ advancing: 0, declining: 0, unchanged: 0 });
  const [vixLevel, setVixLevel] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketSentiment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('MarketSentiment: Fetching sentiment data');

      // For now, we'll use realistic mock data
      // In production, you'd fetch from sentiment APIs like:
      // - CNN Fear & Greed Index API
      // - VIX data from market APIs
      // - Put/Call ratios from options data
      const sentimentData = getMockSentimentData();
      
      setFearGreedIndex(sentimentData.fearGreedIndex);
      setIndicators(sentimentData.indicators);
      setMarketBreadth(sentimentData.marketBreadth);
      setVixLevel(sentimentData.vixLevel);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('MarketSentiment: Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      // Use fallback data on error
      const sentimentData = getMockSentimentData();
      setFearGreedIndex(sentimentData.fearGreedIndex);
      setIndicators(sentimentData.indicators);
      setMarketBreadth(sentimentData.marketBreadth);
      setVixLevel(sentimentData.vixLevel);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockSentimentData = () => {
    // Generate realistic sentiment data with some randomness
    const baseIndex = 52 + (Math.random() - 0.5) * 20; // 42-62 range
    const fearGreedIndex = Math.max(0, Math.min(100, baseIndex));

    const indicators: SentimentIndicator[] = [
      {
        name: 'Market Momentum',
        value: 55 + (Math.random() - 0.5) * 20,
        change: (Math.random() - 0.5) * 10,
        description: 'S&P 500 vs 125-day average',
        status: 'neutral',
      },
      {
        name: 'Stock Price Strength',
        value: 48 + (Math.random() - 0.5) * 20,
        change: (Math.random() - 0.5) * 8,
        description: 'Number of stocks at 52-week highs',
        status: 'neutral',
      },
      {
        name: 'Stock Price Breadth',
        value: 52 + (Math.random() - 0.5) * 20,
        change: (Math.random() - 0.5) * 12,
        description: 'Advancing vs declining volume',
        status: 'neutral',
      },
      {
        name: 'Put/Call Ratio',
        value: 45 + (Math.random() - 0.5) * 20,
        change: (Math.random() - 0.5) * 6,
        description: 'Options market positioning',
        status: 'neutral',
      },
      {
        name: 'Market Volatility',
        value: 40 + (Math.random() - 0.5) * 20,
        change: (Math.random() - 0.5) * 15,
        description: 'VIX relative to average',
        status: 'neutral',
      },
    ];

    // Assign status based on value
    indicators.forEach(ind => {
      ind.status = getSentimentStatus(ind.value);
    });

    const totalStocks = 500;
    const advancingPct = 0.45 + (Math.random() * 0.2);
    const decliningPct = 1 - advancingPct - 0.05;
    
    const marketBreadth = {
      advancing: Math.floor(totalStocks * advancingPct),
      declining: Math.floor(totalStocks * decliningPct),
      unchanged: totalStocks - Math.floor(totalStocks * advancingPct) - Math.floor(totalStocks * decliningPct),
    };

    const vixLevel = 14 + (Math.random() * 12); // 14-26 range

    return { fearGreedIndex, indicators, marketBreadth, vixLevel };
  };

  const getSentimentStatus = (value: number): SentimentIndicator['status'] => {
    if (value <= 20) return 'extreme-fear';
    if (value <= 40) return 'fear';
    if (value <= 60) return 'neutral';
    if (value <= 80) return 'greed';
    return 'extreme-greed';
  };

  const getSentimentLabel = (status: SentimentIndicator['status']): string => {
    const labels = {
      'extreme-fear': 'Extreme Fear',
      'fear': 'Fear',
      'neutral': 'Neutral',
      'greed': 'Greed',
      'extreme-greed': 'Extreme Greed',
    };
    return labels[status];
  };

  const getSentimentColor = (status: SentimentIndicator['status']): string => {
    const colors = {
      'extreme-fear': 'text-red-600',
      'fear': 'text-orange-600',
      'neutral': 'text-yellow-600',
      'greed': 'text-lime-600',
      'extreme-greed': 'text-green-600',
    };
    return colors[status];
  };

  const getSentimentBgColor = (status: SentimentIndicator['status']): string => {
    const colors = {
      'extreme-fear': 'bg-red-500',
      'fear': 'bg-orange-500',
      'neutral': 'bg-yellow-500',
      'greed': 'bg-lime-500',
      'extreme-greed': 'bg-green-500',
    };
    return colors[status];
  };

  useEffect(() => {
    fetchMarketSentiment();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMarketSentiment, 60000);
    return () => clearInterval(interval);
  }, []);

  const overallStatus = getSentimentStatus(fearGreedIndex);
  const advancingPct = marketBreadth.advancing + marketBreadth.declining > 0
    ? (marketBreadth.advancing / (marketBreadth.advancing + marketBreadth.declining)) * 100
    : 50;

  if (isLoading && indicators.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading sentiment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4" />
          <span className="text-sm font-medium">Market Sentiment</span>
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchMarketSentiment}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Fear & Greed Index */}
      <div className="bg-muted/50 rounded-lg p-3 mb-3">
        <div className="text-xs text-muted-foreground mb-2 text-center">Fear & Greed Index</div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold">{fearGreedIndex.toFixed(0)}</span>
          <Badge variant="outline" className={cn("text-xs", getSentimentColor(overallStatus))}>
            {getSentimentLabel(overallStatus)}
          </Badge>
        </div>

        {/* Gradient Bar */}
        <div className="relative w-full h-2 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
          <div
            className="absolute top-0 h-full w-1 bg-white border-2 border-foreground"
            style={{ left: `${fearGreedIndex}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-1">
          <span className="text-xs text-red-600 font-medium">Fear</span>
          <span className="text-xs text-green-600 font-medium">Greed</span>
        </div>
      </div>

      {/* VIX & Market Breadth */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-muted/50 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">VIX</span>
          </div>
          <div className="text-lg font-bold">{vixLevel.toFixed(2)}</div>
          <div className={cn(
            "text-xs",
            vixLevel < 15 ? "text-green-600" : vixLevel < 20 ? "text-yellow-600" : "text-red-600"
          )}>
            {vixLevel < 15 ? 'Low' : vixLevel < 20 ? 'Normal' : vixLevel < 30 ? 'High' : 'Very High'}
          </div>
        </div>

        <div className="bg-muted/50 rounded p-2">
          <div className="flex items-center gap-1 mb-1">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Breadth</span>
          </div>
          <div className="text-lg font-bold">{advancingPct.toFixed(0)}%</div>
          <div className={cn(
            "text-xs",
            advancingPct > 55 ? "text-green-600" : advancingPct > 45 ? "text-yellow-600" : "text-red-600"
          )}>
            {marketBreadth.advancing}↑ {marketBreadth.declining}↓
          </div>
        </div>
      </div>

      {/* Sentiment Indicators */}
      <div className="flex-1 overflow-auto space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">Sentiment Indicators</div>
        
        {indicators.map((indicator, index) => (
          <div key={index} className="bg-muted/30 rounded p-2">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{indicator.name}</div>
                <div className="text-xs text-muted-foreground truncate">{indicator.description}</div>
              </div>
              <div className="ml-2 text-right flex-shrink-0">
                <div className="text-sm font-medium">{indicator.value.toFixed(0)}</div>
                <div className={cn(
                  "text-xs",
                  indicator.change >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {indicator.change >= 0 ? '+' : ''}{indicator.change.toFixed(1)}
                </div>
              </div>
            </div>
            
            {/* Mini progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all", getSentimentBgColor(indicator.status))}
                style={{ width: `${indicator.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground text-center">
        <div className="flex items-center justify-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Based on multiple market indicators</span>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Using demo data
        </div>
      )}
    </div>
  );
}

