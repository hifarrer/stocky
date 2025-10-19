'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSymbol } from '@/contexts';
import { cn } from '@/lib/utils';

interface CryptoHeatmapData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  rank?: number;
}

interface CryptoHeatmapProps {
  maxItems?: number;
  className?: string;
}

export function CryptoHeatmap({ 
  maxItems = 20,
  className 
}: CryptoHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<CryptoHeatmapData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { selectSymbol } = useSymbol();

  // Fetch crypto market data via our API route (to avoid CORS)
  const fetchCryptoData = async () => {
    console.log('CryptoHeatmap: Fetching crypto market data');
    setIsLoading(true);
    setError(null);

    try {
      // Call our Next.js API route instead of CoinGecko directly
      const params = new URLSearchParams({
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: maxItems.toString(),
        page: '1',
        sparkline: 'false',
        price_change_percentage: '24h',
      });

      const response = await fetch(`/api/crypto/markets?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('CryptoHeatmap: Data received:', data.length, 'coins');

      if (data && data.length > 0) {
        const formattedData: CryptoHeatmapData[] = data.map((coin: any) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change: coin.price_change_24h,
          changePercent: coin.price_change_percentage_24h,
          volume: coin.total_volume,
          marketCap: coin.market_cap,
          rank: coin.market_cap_rank,
        }));

        console.log('CryptoHeatmap: Formatted data:', formattedData.length, 'items');
        setHeatmapData(formattedData);
        setLastUpdated(new Date());
      } else {
        console.log('CryptoHeatmap: No data received, showing mock data');
        setHeatmapData(getMockData());
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('CryptoHeatmap: Error fetching crypto data:', err);
      
      // Extract error message
      let errorMessage = 'Failed to load crypto data';
      
      if (err && typeof err === 'object') {
        if ('message' in err && err.message) {
          errorMessage = String(err.message);
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      console.error('CryptoHeatmap: Detailed error:', errorMessage);
      setError(errorMessage);
      
      // Show mock data on error
      console.log('CryptoHeatmap: Setting mock data due to API failure');
      setHeatmapData(getMockData());
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for fallback
  const getMockData = (): CryptoHeatmapData[] => [
    { symbol: 'BTC', name: 'Bitcoin', price: 67543.21, change: 1234.56, changePercent: 1.86, volume: 28500000000, marketCap: 1320000000000, rank: 1 },
    { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change: -87.32, changePercent: -2.46, volume: 15200000000, marketCap: 415000000000, rank: 2 },
    { symbol: 'BNB', name: 'BNB', price: 612.34, change: 15.67, changePercent: 2.63, volume: 1800000000, marketCap: 94000000000, rank: 3 },
    { symbol: 'SOL', name: 'Solana', price: 145.67, change: 8.91, changePercent: 6.52, volume: 2100000000, marketCap: 67000000000, rank: 4 },
    { symbol: 'ADA', name: 'Cardano', price: 0.5432, change: 0.0234, changePercent: 4.31, volume: 850000000, marketCap: 19000000000, rank: 5 },
    { symbol: 'AVAX', name: 'Avalanche', price: 32.45, change: -1.23, changePercent: -3.65, volume: 430000000, marketCap: 12500000000, rank: 6 },
    { symbol: 'DOT', name: 'Polkadot', price: 6.78, change: -0.32, changePercent: -4.51, volume: 340000000, marketCap: 9800000000, rank: 7 },
    { symbol: 'MATIC', name: 'Polygon', price: 0.8765, change: 0.0543, changePercent: 6.60, volume: 520000000, marketCap: 8100000000, rank: 8 },
    { symbol: 'LINK', name: 'Chainlink', price: 14.56, change: 0.87, changePercent: 6.35, volume: 390000000, marketCap: 8500000000, rank: 9 },
    { symbol: 'UNI', name: 'Uniswap', price: 8.92, change: -0.45, changePercent: -4.80, volume: 280000000, marketCap: 6700000000, rank: 10 },
    { symbol: 'XRP', name: 'XRP', price: 0.6234, change: 0.0123, changePercent: 2.01, volume: 1200000000, marketCap: 33000000000, rank: 11 },
    { symbol: 'DOGE', name: 'Dogecoin', price: 0.0876, change: -0.0034, changePercent: -3.74, volume: 650000000, marketCap: 12400000000, rank: 12 },
    { symbol: 'ATOM', name: 'Cosmos', price: 9.87, change: 0.54, changePercent: 5.79, volume: 210000000, marketCap: 3800000000, rank: 13 },
    { symbol: 'LTC', name: 'Litecoin', price: 82.34, change: -2.45, changePercent: -2.89, volume: 420000000, marketCap: 6100000000, rank: 14 },
    { symbol: 'NEAR', name: 'NEAR Protocol', price: 5.67, change: 0.32, changePercent: 5.98, volume: 180000000, marketCap: 5900000000, rank: 15 },
    { symbol: 'APT', name: 'Aptos', price: 8.45, change: -0.67, changePercent: -7.34, volume: 150000000, marketCap: 3400000000, rank: 16 },
    { symbol: 'ARB', name: 'Arbitrum', price: 1.23, change: 0.08, changePercent: 6.96, volume: 320000000, marketCap: 4200000000, rank: 17 },
    { symbol: 'OP', name: 'Optimism', price: 2.34, change: -0.12, changePercent: -4.88, volume: 190000000, marketCap: 2800000000, rank: 18 },
    { symbol: 'FIL', name: 'Filecoin', price: 5.43, change: 0.21, changePercent: 4.02, volume: 140000000, marketCap: 3100000000, rank: 19 },
    { symbol: 'HBAR', name: 'Hedera', price: 0.0678, change: -0.0023, changePercent: -3.29, volume: 95000000, marketCap: 2400000000, rank: 20 },
  ];

  // Load data on mount
  useEffect(() => {
    fetchCryptoData();
    
    // Auto-refresh every 60 seconds (CoinGecko has rate limits)
    const interval = setInterval(fetchCryptoData, 60000);
    return () => clearInterval(interval);
  }, [maxItems]);

  // Get color based on performance
  const getPerformanceColor = (changePercent: number) => {
    if (changePercent > 5) return 'bg-green-600 text-white';
    if (changePercent > 2) return 'bg-green-600/80 text-white';
    if (changePercent > 0) return 'bg-green-600/60 text-white';
    if (changePercent > -2) return 'bg-red-600/60 text-white';
    if (changePercent > -5) return 'bg-red-600/80 text-white';
    return 'bg-red-600 text-white';
  };

  // Get size based on market cap (for visual hierarchy)
  const getSizeClass = (marketCap: number | undefined, maxMarketCap: number) => {
    if (!marketCap) return '';
    const ratio = marketCap / maxMarketCap;
    if (ratio > 0.5) return 'col-span-2 row-span-2';
    if (ratio > 0.3) return 'col-span-2';
    if (ratio > 0.15) return 'row-span-2';
    return '';
  };

  const handleTileClick = (item: CryptoHeatmapData) => {
    selectSymbol({
      symbol: `X:${item.symbol}USD`,
      market: 'crypto',
      name: item.name,
    });
  };

  const maxMarketCap = useMemo(() => {
    return Math.max(...heatmapData.map(item => item.marketCap || 0), 1);
  }, [heatmapData]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(0)}`;
  };

  if (isLoading && heatmapData.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading crypto data...</span>
        </div>
      </div>
    );
  }

  if (!error && heatmapData.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center text-muted-foreground", className)}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1">No Crypto Data</div>
          <div className="text-xs">Unable to load cryptocurrency market data</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Cryptocurrency Market</h3>
          <Badge variant="outline" className="text-xs">
            {heatmapData.length} coins
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
            onClick={fetchCryptoData}
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
                getSizeClass(item.marketCap, maxMarketCap)
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

                {/* Rank indicator - only show on larger tiles */}
                {item.rank && item.rank <= 10 && (
                  <div className="absolute top-1 right-1 text-xs opacity-70 font-bold">
                    #{item.rank}
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
              <span>24h Gains</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-red-600" />
              <span>24h Losses</span>
            </div>
          </div>
          <div>Powered by CoinGecko</div>
        </div>
      </div>
    </div>
  );
}

