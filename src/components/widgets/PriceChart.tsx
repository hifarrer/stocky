'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSymbol, useWebSocket, useUserPreferences } from '@/contexts';
import { createPolygonClient } from '@/lib/polygon';
import { TimeFrame, AggregateData } from '@/types';
import { format } from 'date-fns';

interface ChartData {
  timestamp: number;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  date: string;
  time: string;
}

interface PriceChartProps {
  height?: number;
  showControls?: boolean;
  showVolume?: boolean;
}

const timeframes: { value: TimeFrame; label: string }[] = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  { value: '15m', label: '15M' },
  { value: '1h', label: '1H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1M', label: '1Mo' },
];

export function PriceChart({ 
  height = 400, 
  showControls = true, 
  showVolume = false 
}: PriceChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update container dimensions when ref changes
  useEffect(() => {
    if (containerRef.current) {
      const dimensions = { 
        width: containerRef.current.offsetWidth, 
        height: containerRef.current.offsetHeight
      };
      setContainerDimensions(dimensions);
    }
  }, [chartData.length]); // Only update when chart data changes
  
  // Determine if the chart is bullish (green) or bearish (red)
  const isBullish = useMemo(() => {
    if (chartData.length < 2) return true;
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    return lastPrice >= firstPrice;
  }, [chartData]);
  
  // Dynamic colors based on trend
  const chartColor = isBullish ? '#16a34a' : '#dc2626'; // green-600 : red-600
  const chartFillColor = isBullish ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)';
  
  const { selectedSymbol } = useSymbol();
  const { getLatestPrice, getPriceHistory, isConnected } = useWebSocket();
  const { chartTimeframe, setChartTimeframe } = useUserPreferences();
  
  // Create Polygon client (in production, this would be in a service layer)
  const polygonClient = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo';
    return createPolygonClient(apiKey);
  }, []);

  // Fetch historical data
  const fetchChartData = useCallback(async (symbol: string, timeframe: TimeFrame) => {
    if (!symbol) return;
    
    // Validate symbol format (alphanumeric, 1-5 chars typically)
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      console.warn('PriceChart: Invalid symbol format:', symbol);
      setError(`Invalid symbol: ${symbol}`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await polygonClient.historical.getChartData(symbol, timeframe, 100);
      
      if (data.results && data.results.length > 0) {
        const formattedData = data.results.map((item: AggregateData) => {
          const date = new Date(item.t);
          return {
            timestamp: item.t,
            price: item.c,
            volume: item.v,
            high: item.h,
            low: item.l,
            open: item.o,
            close: item.c,
            date: format(date, 'MMM dd'),
            time: format(date, 'HH:mm'),
          };
        });
        
        setChartData(formattedData);
      } else {
        setChartData([]);
      }
    } catch (err) {
      console.error('PriceChart: Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
      
      // Show mock data if API fails
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (30 - i) * 24 * 60 * 60 * 1000,
        price: 150 + Math.sin(i * 0.2) * 10 + Math.random() * 5,
        volume: Math.floor(Math.random() * 1000000),
        high: 155 + Math.random() * 5,
        low: 145 + Math.random() * 5,
        open: 150 + Math.random() * 5,
        close: 150 + Math.random() * 5,
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        time: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleTimeString(),
      }));
      setChartData(mockData);
    } finally {
      setIsLoading(false);
    }
  }, [polygonClient]);

  // Use NVDA as fallback when no symbol is selected
  const displaySymbol = selectedSymbol || {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    market: 'stocks',
    type: 'stock',
    exchange: 'NASDAQ',
    country: 'US',
    isActive: true,
    lastUpdated: new Date().toISOString(),
  };

  // Load data when symbol or timeframe changes
  useEffect(() => {
    fetchChartData(displaySymbol.symbol, chartTimeframe);
  }, [selectedSymbol, chartTimeframe, polygonClient, displaySymbol.symbol, fetchChartData]);

  // Update with real-time data - debounced to prevent glitchy updates
  useEffect(() => {
    if (selectedSymbol && isConnected) {
      const latestPrice = getLatestPrice(displaySymbol.symbol);
      const priceHistory = getPriceHistory(displaySymbol.symbol);
      
      if (latestPrice && priceHistory.length > 0) {
        // Debounce real-time updates to prevent glitchy behavior
        const timeoutId = setTimeout(() => {
          // Only add the latest price point, not the entire history
          const latestEntry = priceHistory[priceHistory.length - 1];
          if (latestEntry) {
            const realtimeData = [{
              timestamp: latestEntry.timestamp,
              price: latestEntry.price,
              volume: 0, // Volume not available in real-time data
              high: latestEntry.price,
              low: latestEntry.price,
              open: latestEntry.price,
              close: latestEntry.price,
              date: format(new Date(latestEntry.timestamp), 'MMM dd'),
              time: format(new Date(latestEntry.timestamp), 'HH:mm'),
            }];
            
            // Merge with existing data (avoid duplicates)
            setChartData(prev => {
              const combined = [...prev, ...realtimeData];
              const unique = combined.filter((item, index, arr) => 
                arr.findIndex(t => t.timestamp === item.timestamp) === index
              );
              // Keep only the last 100 data points to prevent memory issues
              return unique.sort((a, b) => a.timestamp - b.timestamp).slice(-100);
            });
          }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedSymbol, isConnected, getLatestPrice, getPriceHistory, displaySymbol.symbol]);

  const handleTimeframeChange = (newTimeframe: TimeFrame) => {
    setChartTimeframe(newTimeframe);
  };

  // Throttle price updates to prevent glitchy display
  const [throttledPrice, setThrottledPrice] = useState<number | null>(null);
  const [throttledPriceChange, setThrottledPriceChange] = useState<{absolute: number; percentage: number} | null>(null);

  useEffect(() => {
    if (chartData.length > 0) {
      const timeoutId = setTimeout(() => {
        const current = chartData[chartData.length - 1]?.price;
        if (current) {
          setThrottledPrice(current);
          
          // Calculate price change only if we have enough data
          if (chartData.length >= 2) {
            const previous = chartData[0]?.price;
            if (previous) {
              setThrottledPriceChange({
                absolute: current - previous,
                percentage: ((current - previous) / previous) * 100,
              });
            }
          }
        }
      }, 500); // 500ms throttle

      return () => clearTimeout(timeoutId);
    }
  }, [chartData]);

  const currentPrice = throttledPrice;
  const priceChange = throttledPriceChange;

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'price') {
      return [`$${value.toFixed(2)}`, 'Price'];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: number) => {
    const date = new Date(tickItem);
    
    switch (chartTimeframe) {
      case '1m':
      case '5m':
      case '15m':
      case '1h':
        return format(date, 'HH:mm');
      case '1d':
        return format(date, 'MMM dd');
      case '1w':
      case '1M':
        return format(date, 'MMM dd');
      default:
        return format(date, 'MMM dd');
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold">{displaySymbol.symbol}</h3>
            <p className="text-sm text-muted-foreground">{displaySymbol.name}</p>
          </div>
          
          {currentPrice && (
            <div className="text-right">
              <div className="text-2xl font-bold">
                ${currentPrice.toFixed(2)}
              </div>
              {priceChange && (
                <div className={`text-sm flex items-center gap-1 ${
                  priceChange.absolute >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  <span>
                    {priceChange.absolute >= 0 ? '+' : ''}
                    ${priceChange.absolute.toFixed(2)}
                  </span>
                  <span>
                    ({priceChange.absolute >= 0 ? '+' : ''}
                    {priceChange.percentage.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time indicator */}
        {isConnected && (
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 rounded-full bg-success mr-1 animate-pulse" />
            Live
          </Badge>
        )}
      </div>

      {/* Timeframe Controls */}
      {showControls && (
        <div className="flex items-center gap-1 mb-4">
          {timeframes.map((tf) => (
            <Button
              key={tf.value}
              variant={chartTimeframe === tf.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTimeframeChange(tf.value)}
              className="text-xs"
            >
              {tf.label}
            </Button>
          ))}
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading chart data...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-destructive">
            <div className="text-center">
              <div className="text-sm font-medium mb-1">Error loading chart</div>
              <div className="text-xs">{error}</div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => fetchChartData(displaySymbol.symbol, chartTimeframe)}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-sm font-medium mb-1">No Data Available</div>
              <div className="text-xs">Chart data not available for this timeframe</div>
            </div>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="absolute inset-0"
          >
            <ResponsiveContainer 
              width="100%" 
              height="100%"
            >
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatXAxisLabel}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy HH:mm')}
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#colorPrice)"
                dot={false}
                activeDot={{ r: 4, stroke: chartColor, strokeWidth: 2, fill: chartColor }}
              />
              {priceChange && (
                <ReferenceLine
                  y={chartData[0]?.price}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="2 2"
                  label={{ value: "Open", position: "right" }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}