'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSymbol } from '@/contexts';
import { createPolygonClient } from '@/lib/polygon';
import { MarketType } from '@/types';
import { cn } from '@/lib/utils';

interface HeatmapData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  sector?: string;
}

interface MarketHeatmapProps {
  marketType?: MarketType;
  maxItems?: number;
  className?: string;
}

export function MarketHeatmap({ 
  marketType = 'stocks', 
  maxItems = 20,
  className 
}: MarketHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { selectSymbol } = useSymbol();

  // Create Polygon client
  const polygonClient = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo';
    console.log('MarketHeatmap: API Key configured:', apiKey ? (apiKey === 'demo' ? 'using demo key' : 'using real key') : 'MISSING');
    return createPolygonClient(apiKey);
  }, []);

  // Fetch market data
  const fetchMarketData = async () => {
    console.log('MarketHeatmap: Fetching market data for', marketType);
    setIsLoading(true);
    setError(null);

    try {
      let data;
      
      if (marketType === 'crypto') {
        console.log('MarketHeatmap: Calling getCryptoSnapshots...');
        data = await polygonClient.snapshot.getCryptoSnapshots();
        console.log('MarketHeatmap: Crypto data received:', data);
      } else {
        // Get both gainers and losers for a comprehensive view
        const [gainers, losers] = await Promise.allSettled([
          polygonClient.snapshot.getGainersLosers('gainers'),
          polygonClient.snapshot.getGainersLosers('losers'),
        ]);

        const gainersData = gainers.status === 'fulfilled' ? gainers.value.results || [] : [];
        const losersData = losers.status === 'fulfilled' ? losers.value.results || [] : [];
        
        console.log('MarketHeatmap: Gainers data', gainersData);
        console.log('MarketHeatmap: Losers data', losersData);
        
        // Combine and sort by volume for better representation
        const combined = [...gainersData, ...losersData]
          .sort((a, b) => (b.last_trade?.s || 0) - (a.last_trade?.s || 0))
          .slice(0, maxItems);

        console.log('MarketHeatmap: Combined data', combined);
        data = { results: combined };
      }

      if (data.results && data.results.length > 0) {
        const formattedData: HeatmapData[] = data.results
          .slice(0, maxItems)
          .map((item: Record<string, unknown>) => ({
            symbol: item.ticker as string,
            name: (item.name || item.ticker) as string,
            price: (item.value || (item.session as Record<string, unknown>)?.close || 0) as number,
            change: (item.todaysChange || (item.session as Record<string, unknown>)?.change || 0) as number,
            changePercent: (item.todaysChangePerc || (item.session as Record<string, unknown>)?.change_percent || 0) as number,
            volume: ((item.min as Record<string, unknown>)?.v || (item.last_trade as Record<string, unknown>)?.s || 0) as number,
            marketCap: item.market_cap as number,
            sector: item.sector as string,
          }))
          .filter(item => item.price > 0); // Filter out invalid data

        console.log('MarketHeatmap: Formatted data', formattedData.length, 'items');
        setHeatmapData(formattedData);
        setLastUpdated(new Date());
      } else {
        console.log('MarketHeatmap: No data received, showing mock data');
        // Show mock data if API returns no data
        const mockData = [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, change: 2.15, changePercent: 1.45, volume: 45000000, sector: 'Technology' },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.50, change: -15.25, changePercent: -0.54, volume: 1200000, sector: 'Technology' },
          { symbol: 'MSFT', name: 'Microsoft Corp.', price: 350.75, change: 5.30, changePercent: 1.53, volume: 25000000, sector: 'Technology' },
          { symbol: 'TSLA', name: 'Tesla Inc.', price: 220.40, change: -8.90, changePercent: -3.88, volume: 35000000, sector: 'Automotive' },
          { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 450.60, change: 12.35, changePercent: 2.82, volume: 18000000, sector: 'Technology' },
        ];
        setHeatmapData(mockData);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('MarketHeatmap: Error fetching market data:', err);
      
      // Extract error message from various error formats
      let errorMessage = 'Failed to load market data';
      
      if (err && typeof err === 'object') {
        // Handle PolygonError format
        if ('message' in err && err.message) {
          errorMessage = String(err.message);
        } else if ('error' in err && err.error) {
          errorMessage = String(err.error);
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      console.error('MarketHeatmap: Detailed error:', errorMessage);
      console.error('MarketHeatmap: Error type:', typeof err);
      console.error('MarketHeatmap: Error keys:', err ? Object.keys(err) : 'none');
      
      setError(errorMessage);
      
      // Show mock data if API fails
      console.log('MarketHeatmap: Setting mock data due to API failure');
      const mockData = marketType === 'crypto' ? [
        { symbol: 'X:BTCUSD', name: 'Bitcoin', price: 67543.21, change: 1234.56, changePercent: 1.86, volume: 28500000000, sector: 'Crypto' },
        { symbol: 'X:ETHUSD', name: 'Ethereum', price: 3456.78, change: -87.32, changePercent: -2.46, volume: 15200000000, sector: 'Crypto' },
        { symbol: 'X:SOLUSD', name: 'Solana', price: 145.67, change: 8.91, changePercent: 6.52, volume: 2100000000, sector: 'Crypto' },
        { symbol: 'X:ADAUSD', name: 'Cardano', price: 0.5432, change: 0.0234, changePercent: 4.31, volume: 850000000, sector: 'Crypto' },
        { symbol: 'X:DOTUSD', name: 'Polkadot', price: 6.78, change: -0.32, changePercent: -4.51, volume: 340000000, sector: 'Crypto' },
        { symbol: 'X:MATICUSD', name: 'Polygon', price: 0.8765, change: 0.0543, changePercent: 6.60, volume: 520000000, sector: 'Crypto' },
        { symbol: 'X:AVAXUSD', name: 'Avalanche', price: 32.45, change: -1.23, changePercent: -3.65, volume: 430000000, sector: 'Crypto' },
        { symbol: 'X:LINKUSD', name: 'Chainlink', price: 14.56, change: 0.87, changePercent: 6.35, volume: 390000000, sector: 'Crypto' },
      ] : [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150.25, change: 2.15, changePercent: 1.45, volume: 45000000, sector: 'Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.50, change: -15.25, changePercent: -0.54, volume: 1200000, sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 350.75, change: 5.30, changePercent: 1.53, volume: 25000000, sector: 'Technology' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 220.40, change: -8.90, changePercent: -3.88, volume: 35000000, sector: 'Automotive' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 450.60, change: 12.35, changePercent: 2.82, volume: 18000000, sector: 'Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3200.80, change: -25.40, changePercent: -0.79, volume: 8000000, sector: 'Consumer Discretionary' },
        { symbol: 'META', name: 'Meta Platforms Inc.', price: 280.90, change: 8.75, changePercent: 3.21, volume: 15000000, sector: 'Technology' },
        { symbol: 'NFLX', name: 'Netflix Inc.', price: 450.25, change: -12.80, changePercent: -2.76, volume: 5000000, sector: 'Communication Services' },
      ];
      setHeatmapData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when market type changes
  useEffect(() => {
    fetchMarketData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [marketType, maxItems, polygonClient]);

  // Get color based on performance
  const getPerformanceColor = (changePercent: number) => {
    if (changePercent > 5) return 'bg-green-600 text-white';
    if (changePercent > 2) return 'bg-green-600/80 text-white';
    if (changePercent > 0) return 'bg-green-600/60 text-white';
    if (changePercent > -2) return 'bg-red-600/60 text-white';
    if (changePercent > -5) return 'bg-red-600/80 text-white';
    return 'bg-red-600 text-white';
  };

  // Get size based on volume (for visual hierarchy)
  const getSizeClass = (volume: number, maxVolume: number) => {
    const ratio = volume / maxVolume;
    if (ratio > 0.8) return 'col-span-2 row-span-2';
    if (ratio > 0.6) return 'col-span-2';
    if (ratio > 0.4) return 'row-span-2';
    return '';
  };

  const handleTileClick = (item: HeatmapData) => {
    selectSymbol({
      symbol: item.symbol,
      market: marketType,
      name: item.name,
      sector: item.sector,
    });
  };

  const maxVolume = useMemo(() => {
    return Math.max(...heatmapData.map(item => item.volume), 1);
  }, [heatmapData]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatPrice = (price: number) => {
    if (marketType === 'crypto' && price < 1) {
      return `$${price.toFixed(4)}`;
    }
    return `$${price.toFixed(2)}`;
  };

  if (isLoading && heatmapData.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading market data...</span>
        </div>
      </div>
    );
  }

  // Don't return early for errors - show mock data with error banner instead
  if (!error && heatmapData.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center text-muted-foreground", className)}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1">No Market Data</div>
          <div className="text-xs">Unable to load {marketType} market data</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium capitalize">{marketType} Market</h3>
          <Badge variant="outline" className="text-xs">
            {heatmapData.length} symbols
          </Badge>
          {error && (
            <Badge variant="destructive" className="text-xs">
              Mock Data
            </Badge>
          )}
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
            onClick={fetchMarketData}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          <div className="font-medium">API Error</div>
          <div className="opacity-80">{error}</div>
          <div className="mt-1 text-xs opacity-60">Showing mock data for demonstration</div>
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-4 gap-1 h-full auto-rows-fr">
          {heatmapData.map((item, index) => (
            <div
              key={`${item.symbol}-${index}`}
              className={cn(
                "relative rounded cursor-pointer transition-all duration-200 hover:scale-105 hover:z-10 hover:shadow-lg p-2 min-h-[60px]",
                getPerformanceColor(item.changePercent),
                getSizeClass(item.volume, maxVolume)
              )}
              onClick={() => handleTileClick(item)}
              title={`${item.name} - ${formatPrice(item.price)} (${item.changePercent.toFixed(2)}%)`}
            >
              <div className="flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <div className="font-medium text-xs truncate pr-1">
                    {item.symbol}
                  </div>
                  {item.changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3 shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 shrink-0" />
                  )}
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <div className="text-xs font-medium">
                    {formatPrice(item.price)}
                  </div>
                  <div className="text-xs opacity-90">
                    {item.changePercent >= 0 ? '+' : ''}
                    {item.changePercent.toFixed(1)}%
                  </div>
                </div>

                {/* Volume indicator - only show on larger tiles */}
                {item.volume > 0 && (
                  <div className="absolute bottom-1 right-1 text-xs opacity-70">
                    {formatNumber(item.volume)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-green-600" />
              <span>Gains</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-red-600" />
              <span>Losses</span>
            </div>
          </div>
          <div>Click to select symbol</div>
        </div>
      </div>
    </div>
  );
}