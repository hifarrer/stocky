'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useSymbol } from '@/contexts';
import { createPolygonClient } from '@/lib/polygon';

interface MoverData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface TopMoversProps {
  className?: string;
  maxItems?: number;
}

export function TopMovers({ className = '', maxItems = 10 }: TopMoversProps) {
  const [gainers, setGainers] = useState<MoverData[]>([]);
  const [losers, setLosers] = useState<MoverData[]>([]);
  const [mostActive, setMostActive] = useState<MoverData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('gainers');

  const { selectSymbol } = useSymbol();
  const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo';
  const polygonClient = createPolygonClient(apiKey);

  const fetchTopMovers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('TopMovers: Fetching top movers data');

      // Fetch gainers and losers from Polygon API
      const [gainersResponse, losersResponse] = await Promise.all([
        polygonClient.snapshot.getGainersLosers('gainers', false).catch(err => {
          console.warn('TopMovers: Gainers API failed:', err);
          return { results: [] };
        }),
        polygonClient.snapshot.getGainersLosers('losers', false).catch(err => {
          console.warn('TopMovers: Losers API failed:', err);
          return { results: [] };
        }),
      ]);

      console.log('TopMovers: Gainers response', gainersResponse);
      console.log('TopMovers: Losers response', losersResponse);

      // Process gainers
      if (gainersResponse.results && gainersResponse.results.length > 0) {
        const formattedGainers: MoverData[] = gainersResponse.results
          .slice(0, maxItems)
          .map((item: Record<string, unknown>) => ({
            symbol: item.ticker as string,
            name: (item.name || item.ticker) as string,
            price: (item.value || (item.session as Record<string, unknown>)?.close || 0) as number,
            change: (item.todaysChange || (item.session as Record<string, unknown>)?.change || 0) as number,
            changePercent: (item.todaysChangePerc || (item.session as Record<string, unknown>)?.change_percent || 0) as number,
            volume: ((item.min as Record<string, unknown>)?.v || (item.session as Record<string, unknown>)?.volume || 0) as number,
          }));
        setGainers(formattedGainers);
      } else {
        console.log('TopMovers: No gainers data, using mock data');
        setGainers(getMockGainers());
      }

      // Process losers
      if (losersResponse.results && losersResponse.results.length > 0) {
        const formattedLosers: MoverData[] = losersResponse.results
          .slice(0, maxItems)
          .map((item: Record<string, unknown>) => ({
            symbol: item.ticker as string,
            name: (item.name || item.ticker) as string,
            price: (item.value || (item.session as Record<string, unknown>)?.close || 0) as number,
            change: (item.todaysChange || (item.session as Record<string, unknown>)?.change || 0) as number,
            changePercent: (item.todaysChangePerc || (item.session as Record<string, unknown>)?.change_percent || 0) as number,
            volume: ((item.min as Record<string, unknown>)?.v || (item.session as Record<string, unknown>)?.volume || 0) as number,
          }));
        setLosers(formattedLosers);
      } else {
        console.log('TopMovers: No losers data, using mock data');
        setLosers(getMockLosers());
      }

      // For most active, we'll combine and sort by volume
      const allStocks = [...(gainersResponse.results || []), ...(losersResponse.results || [])];
      if (allStocks.length > 0) {
        const formattedActive: MoverData[] = allStocks
          .map((item: Record<string, unknown>) => ({
            symbol: item.ticker as string,
            name: (item.name || item.ticker) as string,
            price: (item.value || (item.session as Record<string, unknown>)?.close || 0) as number,
            change: (item.todaysChange || (item.session as Record<string, unknown>)?.change || 0) as number,
            changePercent: (item.todaysChangePerc || (item.session as Record<string, unknown>)?.change_percent || 0) as number,
            volume: ((item.min as Record<string, unknown>)?.v || (item.session as Record<string, unknown>)?.volume || 0) as number,
          }))
          .sort((a, b) => b.volume - a.volume)
          .slice(0, maxItems);
        setMostActive(formattedActive);
      } else {
        console.log('TopMovers: No active data, using mock data');
        setMostActive(getMockActive());
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('TopMovers: Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      
      // Use mock data on error
      setGainers(getMockGainers());
      setLosers(getMockLosers());
      setMostActive(getMockActive());
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data functions
  const getMockGainers = (): MoverData[] => [
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 450.60, change: 25.80, changePercent: 6.08, volume: 45000000 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 125.30, change: 6.45, changePercent: 5.43, volume: 38000000 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.50, change: 11.20, changePercent: 4.78, volume: 52000000 },
    { symbol: 'META', name: 'Meta Platforms', price: 315.75, change: 12.90, changePercent: 4.26, volume: 22000000 },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 425.20, change: 16.80, changePercent: 4.11, volume: 8500000 },
  ];

  const getMockLosers = (): MoverData[] => [
    { symbol: 'BA', name: 'Boeing Co.', price: 175.30, change: -12.50, changePercent: -6.65, volume: 12000000 },
    { symbol: 'DIS', name: 'Walt Disney Co.', price: 88.45, change: -4.90, changePercent: -5.25, volume: 18000000 },
    { symbol: 'PYPL', name: 'PayPal Holdings', price: 62.15, change: -3.10, changePercent: -4.75, volume: 15000000 },
    { symbol: 'INTC', name: 'Intel Corp.', price: 32.80, change: -1.45, changePercent: -4.23, volume: 42000000 },
    { symbol: 'NKE', name: 'Nike Inc.', price: 92.30, change: -3.75, changePercent: -3.90, volume: 9500000 },
  ];

  const getMockActive = (): MoverData[] => [
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.50, change: 11.20, changePercent: 4.78, volume: 52000000 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 450.60, change: 25.80, changePercent: 6.08, volume: 45000000 },
    { symbol: 'INTC', name: 'Intel Corp.', price: 32.80, change: -1.45, changePercent: -4.23, volume: 42000000 },
    { symbol: 'AMD', name: 'Advanced Micro Devices', price: 125.30, change: 6.45, changePercent: 5.43, volume: 38000000 },
    { symbol: 'AAPL', name: 'Apple Inc.', price: 252.40, change: 7.00, changePercent: 2.85, volume: 35000000 },
  ];

  // Load data on mount
  useEffect(() => {
    fetchTopMovers();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchTopMovers, 60000);
    return () => clearInterval(interval);
  }, [maxItems]);

  const handleSymbolClick = (item: MoverData) => {
    selectSymbol({
      symbol: item.symbol,
      name: item.name,
      market: 'stocks',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const renderMoverRow = (item: MoverData, index: number, array: MoverData[]) => {
    const isPositive = item.changePercent >= 0;
    const isLast = index === array.length - 1;

    return (
      <div key={item.symbol} className={cn(
        index === 0 && "pt-1",
        isLast && "pb-1"
      )}>
        <div
          className="flex items-center justify-between py-3 px-3 hover:bg-muted/50 hover:shadow-sm rounded cursor-pointer transition-all duration-200"
          onClick={() => handleSymbolClick(item)}
        >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{item.symbol}</span>
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{item.name}</div>
        </div>

        <div className="flex items-center gap-4 ml-2">
          <div className="text-right">
            <div className="text-sm font-medium">{formatPrice(item.price)}</div>
            <div className={cn(
              "text-xs font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground hidden sm:block">
            {formatNumber(item.volume)}
          </div>
        </div>
        </div>
        {!isLast && (
          <div className="mx-3 border-b border-border/30" />
        )}
      </div>
    );
  };

  if (isLoading && gainers.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading top movers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">Top Movers</span>
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
            onClick={fetchTopMovers}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-3">
          <TabsTrigger value="gainers" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Gainers
          </TabsTrigger>
          <TabsTrigger value="losers" className="text-xs">
            <TrendingDown className="h-3 w-3 mr-1" />
            Losers
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Active
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="gainers" className="mt-0">
            {gainers.length > 0 ? (
              gainers.map((item, index) => renderMoverRow(item, index, gainers))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No gainers data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="losers" className="mt-0">
            {losers.length > 0 ? (
              losers.map((item, index) => renderMoverRow(item, index, losers))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No losers data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-0">
            {mostActive.length > 0 ? (
              mostActive.map((item, index) => renderMoverRow(item, index, mostActive))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                No active data available
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {error && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Using demo data
        </div>
      )}
    </div>
  );
}

