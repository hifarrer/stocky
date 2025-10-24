'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SectorData {
  name: string;
  symbol: string;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
}

interface SectorPerformanceProps {
  className?: string;
}

export function SectorPerformance({ className = '' }: SectorPerformanceProps) {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'performance'>('performance');

  const fetchSectorPerformance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('SectorPerformance: Fetching sector data');

      // For now, we'll use realistic mock data
      // In production, you'd aggregate data from sector ETFs or use a specialized API
      const sectorData = getMockSectorData();
      setSectors(sectorData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('SectorPerformance: Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setSectors(getMockSectorData());
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockSectorData = (): SectorData[] => {
    // Based on S&P 500 sectors with realistic daily performance ranges
    const baseData = [
      { name: 'Technology', symbol: 'XLK', changePercent: 2.45, marketCap: '$12.8T' },
      { name: 'Healthcare', symbol: 'XLV', changePercent: 1.23, marketCap: '$7.2T' },
      { name: 'Financials', symbol: 'XLF', changePercent: 0.87, marketCap: '$8.9T' },
      { name: 'Consumer Discretionary', symbol: 'XLY', changePercent: 1.56, marketCap: '$6.4T' },
      { name: 'Communication Services', symbol: 'XLC', changePercent: -0.34, marketCap: '$4.8T' },
      { name: 'Industrials', symbol: 'XLI', changePercent: 0.65, marketCap: '$5.1T' },
      { name: 'Consumer Staples', symbol: 'XLP', changePercent: -0.12, marketCap: '$3.9T' },
      { name: 'Energy', symbol: 'XLE', changePercent: -1.87, marketCap: '$3.6T' },
      { name: 'Utilities', symbol: 'XLU', changePercent: -0.45, marketCap: '$1.8T' },
      { name: 'Real Estate', symbol: 'XLRE', changePercent: 0.23, marketCap: '$1.5T' },
      { name: 'Materials', symbol: 'XLB', changePercent: -0.89, marketCap: '$2.3T' },
    ];

    // Add some randomness to simulate real-time data
    return baseData.map(sector => {
      const randomVariation = (Math.random() - 0.5) * 0.5; // ±0.25%
      const adjustedChangePercent = sector.changePercent + randomVariation;
      const baseVolume = 5000000 + Math.random() * 15000000;
      
      return {
        ...sector,
        changePercent: adjustedChangePercent,
        change: adjustedChangePercent * 10, // Approximate dollar change
        volume: Math.floor(baseVolume),
      };
    });
  };

  useEffect(() => {
    fetchSectorPerformance();

    // No auto-refresh to reduce client load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSortedSectors = () => {
    const sorted = [...sectors];
    if (sortBy === 'performance') {
      return sorted.sort((a, b) => b.changePercent - a.changePercent);
    }
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const getProgressValue = (changePercent: number) => {
    // Map -3% to 3% range to 0-100 for progress bar
    const maxRange = 3;
    const normalized = ((changePercent + maxRange) / (maxRange * 2)) * 100;
    return Math.max(0, Math.min(100, normalized));
  };

  const renderSectorRow = (sector: SectorData) => {
    const isPositive = sector.changePercent >= 0;
    const absChangePercent = Math.abs(sector.changePercent);

    return (
      <div
        key={sector.symbol}
        className="py-3 px-3 hover:bg-muted/50 rounded transition-colors"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{sector.name}</span>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{sector.symbol}</span>
              <span>•</span>
              <span>{sector.marketCap}</span>
            </div>
          </div>

          <div className="text-right ml-2">
            <div className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? '+' : ''}{sector.changePercent.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(sector.volume)}
            </div>
          </div>
        </div>

        {/* Performance bar */}
        <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute top-0 left-0 h-full rounded-full transition-all",
              isPositive ? "bg-green-500" : "bg-red-500"
            )}
            style={{
              width: `${(absChangePercent / 3) * 100}%`,
              maxWidth: '100%',
            }}
          />
        </div>
      </div>
    );
  };

  if (isLoading && sectors.length === 0) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading sectors...</span>
        </div>
      </div>
    );
  }

  const sortedSectors = getSortedSectors();
  const positiveCount = sectors.filter(s => s.changePercent > 0).length;
  const negativeCount = sectors.filter(s => s.changePercent < 0).length;
  const avgChange = sectors.length > 0
    ? sectors.reduce((sum, s) => sum + s.changePercent, 0) / sectors.length
    : 0;

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Sector Performance</span>
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
            onClick={fetchSectorPerformance}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-muted/50 rounded p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Up</div>
          <div className="text-sm font-medium text-green-600">{positiveCount}</div>
        </div>
        <div className="bg-muted/50 rounded p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Down</div>
          <div className="text-sm font-medium text-red-600">{negativeCount}</div>
        </div>
        <div className="bg-muted/50 rounded p-2 text-center">
          <div className="text-xs text-muted-foreground mb-1">Avg</div>
          <div className={cn(
            "text-sm font-medium",
            avgChange >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 mb-3">
        <Button
          variant={sortBy === 'performance' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => setSortBy('performance')}
        >
          Performance
        </Button>
        <Button
          variant={sortBy === 'name' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => setSortBy('name')}
        >
          Name
        </Button>
      </div>

      {/* Sector List */}
      <div className="flex-1 overflow-auto space-y-1">
        {sortedSectors.length > 0 ? (
          sortedSectors.map(renderSectorRow)
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            No sector data available
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Using demo data
        </div>
      )}
    </div>
  );
}

