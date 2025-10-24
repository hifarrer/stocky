import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Volume2, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSymbol, useWebSocket, useWatchlist } from '@/contexts';
import { createPolygonClient } from '@/lib/polygon';
import { format } from 'date-fns';

interface TickerSnapshotProps {
  className?: string;
}

interface SnapshotInfo {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  lastUpdated: Date;
  marketStatus: 'open' | 'closed' | 'extended_hours';
}

export function TickerSnapshot({ className }: TickerSnapshotProps) {
  const [snapshotData, setSnapshotData] = useState<SnapshotInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { selectedSymbol } = useSymbol();
  const { getLatestPrice, isConnected } = useWebSocket();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  
  // Create Polygon client
  const polygonClient = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo';
    return createPolygonClient(apiKey);
  }, []);

  // Fetch snapshot data - memoized to prevent unnecessary re-renders
  const fetchSnapshot = useCallback(async (symbol: string) => {
    // Validate symbol format (alphanumeric, 1-5 chars typically)
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      console.warn('TickerSnapshot: Invalid symbol format:', symbol);
      setError(`Invalid symbol: ${symbol}`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await polygonClient.snapshot.getTicker(symbol);
      const data = response.ticker;
      
      if (data) {
        setSnapshotData({
          price: data.value || 0,
          change: data.todaysChange || 0,
          changePercent: data.todaysChangePerc || 0,
          volume: data.min?.v || 0,
          high: data.min?.h || data.value || 0,
          low: data.min?.l || data.value || 0,
          open: data.min?.o || data.value || 0,
          previousClose: data.prevDay?.c || 0,
          lastUpdated: new Date((data.updated || Date.now()) / 1000000),
          marketStatus: data.market_status || 'closed',
        });
      } else {
        // Show mock data if API returns no data
        setSnapshotData({
          price: 150.25,
          change: 2.15,
          changePercent: 1.45,
          volume: 45000000,
          high: 152.30,
          low: 148.10,
          open: 149.50,
          previousClose: 148.10,
          lastUpdated: new Date(),
          marketStatus: 'open',
        });
      }
    } catch (err) {
      console.error('TickerSnapshot: Error fetching snapshot:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      // Show mock data if API fails
      setSnapshotData({
        price: 150.25,
        change: 2.15,
        changePercent: 1.45,
        volume: 45000000,
        high: 152.30,
        low: 148.10,
        open: 149.50,
        previousClose: 148.10,
        lastUpdated: new Date(),
        marketStatus: 'open',
      });
    } finally {
      setIsLoading(false);
    }
  }, [polygonClient]);

  // Load data when symbol changes
  useEffect(() => {
    if (selectedSymbol) {
      fetchSnapshot(displaySymbol.symbol);
    }
  }, [selectedSymbol, fetchSnapshot]);

  // Update with real-time price - removed snapshotData from deps to prevent infinite loop
  useEffect(() => {
    if (selectedSymbol && isConnected) {
      const symbol = typeof selectedSymbol === 'string' ? selectedSymbol : selectedSymbol.symbol;
      const latestPrice = getLatestPrice(symbol);
      
      if (latestPrice) {
        setSnapshotData(prev => {
          // Only update if we have previous data and price actually changed
          if (!prev || latestPrice === prev.price) return prev;
          
          const change = latestPrice - prev.previousClose;
          const changePercent = (change / prev.previousClose) * 100;
          
          return {
            ...prev,
            price: latestPrice,
            change,
            changePercent,
            lastUpdated: new Date(),
          };
        });
      }
    }
    // Intentionally not including snapshotData to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, isConnected, getLatestPrice]);

  const handleWatchlistToggle = () => {
    if (!selectedSymbol) return;
    
    if (isInWatchlist(displaySymbol.symbol)) {
      removeFromWatchlist(displaySymbol.symbol);
    } else {
      addToWatchlist(displaySymbol.symbol);
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) {
      return `${(num / 1e9).toFixed(1)}B`;
    }
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`;
    }
    if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`;
    }
    return num.toFixed(decimals);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getMarketStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-success';
      case 'extended_hours':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getMarketStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Market Open';
      case 'extended_hours':
        return 'Extended Hours';
      default:
        return 'Market Closed';
    }
  };

  // Use NVDA as fallback when no symbol is selected
  const displaySymbol = selectedSymbol || {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'stocks',
    type: 'stock',
    exchange: 'NASDAQ',
    sector: 'Technology',
    currency: 'USD',
    country: 'US',
    isActive: true,
    lastUpdated: new Date().toISOString(),
  };

  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center text-destructive ${className}`}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1">Error loading data</div>
          <div className="text-xs mb-2">{error}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSnapshot(displaySymbol.symbol)}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!snapshotData) {
    return (
      <div className={`h-full flex items-center justify-center text-muted-foreground ${className}`}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1">No Data Available</div>
          <div className="text-xs">Unable to load ticker information</div>
        </div>
      </div>
    );
  }

  const isPositive = snapshotData.change >= 0;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold">{displaySymbol.symbol}</h3>
            <Badge 
              variant="outline" 
              className={`text-xs ${getMarketStatusColor(snapshotData.marketStatus)}`}
            >
              {getMarketStatusText(snapshotData.marketStatus)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{selectedSymbol?.name}</p>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWatchlistToggle}
          className="shrink-0"
        >
          <Star 
            className={`h-4 w-4 ${
              isInWatchlist(displaySymbol.symbol) 
                ? 'fill-current text-warning' 
                : 'text-muted-foreground'
            }`} 
          />
        </Button>
      </div>

      {/* Price Information */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold tracking-tight">
            {formatPrice(snapshotData.price)}
          </span>
          {isConnected && (
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
        </div>
        
        <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 ${
          isPositive 
            ? 'text-success bg-success/10 border border-success/20 hover:bg-success/15 price-change-positive price-glow-positive' 
            : 'text-danger bg-danger/10 border border-danger/20 hover:bg-danger/15 price-change-negative price-glow-negative'
        }`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 animate-pulse" />
          ) : (
            <TrendingDown className="h-4 w-4 animate-pulse" />
          )}
          <span className="font-semibold">
            {isPositive ? '+' : ''}{formatPrice(snapshotData.change)}
          </span>
          <span className="font-medium">
            ({isPositive ? '+' : ''}{snapshotData.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 p-2 rounded-md bg-muted/30">
            <div className="text-xs text-muted-foreground">Open</div>
            <div className="text-sm font-medium">{formatPrice(snapshotData.open)}</div>
          </div>
          <div className="space-y-1 p-2 rounded-md bg-success/5 border border-success/10">
            <div className="text-xs text-muted-foreground">High</div>
            <div className="text-sm font-medium text-success">{formatPrice(snapshotData.high)}</div>
          </div>
          <div className="space-y-1 p-2 rounded-md bg-danger/5 border border-danger/10">
            <div className="text-xs text-muted-foreground">Low</div>
            <div className="text-sm font-medium text-danger">{formatPrice(snapshotData.low)}</div>
          </div>
          <div className="space-y-1 p-2 rounded-md bg-muted/30">
            <div className="text-xs text-muted-foreground">Prev Close</div>
            <div className="text-sm font-medium">{formatPrice(snapshotData.previousClose)}</div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-1 p-2 rounded-md bg-info/5 border border-info/10">
            <Volume2 className="h-3 w-3 text-info" />
            <span className="text-xs text-muted-foreground">Volume</span>
          </div>
          <div className="text-sm font-medium px-2">{formatNumber(snapshotData.volume)}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Updated {format(snapshotData.lastUpdated, 'HH:mm:ss')}</span>
        </div>
      </div>
    </div>
  );
}