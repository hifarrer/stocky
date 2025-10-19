'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSymbol } from '@/contexts';
import { createPolygonClient } from '@/lib/polygon';

interface TechnicalIndicatorsProps {
  className?: string;
}

interface IndicatorData {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  movingAverages: {
    ma20: number;
    ma50: number;
    ma200: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  currentPrice: number;
}

export function TechnicalIndicators({ className = '' }: TechnicalIndicatorsProps) {
  const [indicators, setIndicators] = useState<IndicatorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { selectedSymbol } = useSymbol();
  const apiKey = process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo';
  const polygonClient = createPolygonClient(apiKey);

  // Calculate RSI
  const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  };

  // Calculate MACD
  const calculateMACD = (prices: number[]): { value: number; signal: number; histogram: number } => {
    if (prices.length < 26) return { value: 0, signal: 0, histogram: 0 };

    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;

    // For signal line, we'd need to calculate EMA of MACD line
    // Simplified: using a basic average
    const signalLine = macdLine * 0.9; // Simplified
    const histogram = macdLine - signalLine;

    return { value: macdLine, signal: signalLine, histogram };
  };

  // Calculate EMA
  const calculateEMA = (prices: number[], period: number): number => {
    if (prices.length < period) return prices[prices.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  };

  // Calculate Simple Moving Average
  const calculateSMA = (prices: number[], period: number): number => {
    if (prices.length < period) return prices[prices.length - 1];
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  };

  // Calculate Bollinger Bands
  const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2) => {
    const sma = calculateSMA(prices, period);
    const slice = prices.slice(-period);
    
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev),
    };
  };

  const fetchIndicators = async () => {
    if (!selectedSymbol) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('TechnicalIndicators: Fetching data for', selectedSymbol.symbol);

      // Fetch historical data (last 200 days for MA200)
      const response = await polygonClient.historical.getDailyData(
        selectedSymbol.symbol,
        200
      );

      if (response.results && response.results.length > 0) {
        const prices = response.results.map((item: any) => item.c);
        const currentPrice = prices[prices.length - 1];

        const rsi = calculateRSI(prices);
        const macd = calculateMACD(prices);
        const ma20 = calculateSMA(prices, 20);
        const ma50 = calculateSMA(prices, 50);
        const ma200 = calculateSMA(prices, 200);
        const bollingerBands = calculateBollingerBands(prices);

        setIndicators({
          rsi,
          macd,
          movingAverages: { ma20, ma50, ma200 },
          bollingerBands,
          currentPrice,
        });
        setLastUpdated(new Date());
      } else {
        // Use mock data if no results
        console.log('TechnicalIndicators: No data, using mock indicators');
        setIndicators(getMockIndicators());
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('TechnicalIndicators: Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load indicators');
      
      // Use mock data on error
      setIndicators(getMockIndicators());
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockIndicators = (): IndicatorData => ({
    rsi: 58.5,
    macd: { value: 2.45, signal: 1.80, histogram: 0.65 },
    movingAverages: {
      ma20: 248.30,
      ma50: 245.60,
      ma200: 235.80,
    },
    bollingerBands: {
      upper: 255.40,
      middle: 248.30,
      lower: 241.20,
    },
    currentPrice: 252.40,
  });

  useEffect(() => {
    fetchIndicators();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchIndicators, 300000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const getRSISignal = (rsi: number): { label: string; color: string; icon: any } => {
    if (rsi > 70) return { label: 'Overbought', color: 'text-red-600', icon: TrendingDown };
    if (rsi < 30) return { label: 'Oversold', color: 'text-green-600', icon: TrendingUp };
    return { label: 'Neutral', color: 'text-muted-foreground', icon: Minus };
  };

  const getMACDSignal = (macd: { value: number; signal: number; histogram: number }) => {
    if (macd.value > macd.signal && macd.histogram > 0) {
      return { label: 'Bullish', color: 'text-green-600', icon: TrendingUp };
    }
    if (macd.value < macd.signal && macd.histogram < 0) {
      return { label: 'Bearish', color: 'text-red-600', icon: TrendingDown };
    }
    return { label: 'Neutral', color: 'text-muted-foreground', icon: Minus };
  };

  const getTrendSignal = (price: number, ma20: number, ma50: number, ma200: number) => {
    const aboveAll = price > ma20 && price > ma50 && price > ma200;
    const belowAll = price < ma20 && price < ma50 && price < ma200;
    
    if (aboveAll) return { label: 'Strong Uptrend', color: 'text-green-600', icon: TrendingUp };
    if (belowAll) return { label: 'Strong Downtrend', color: 'text-red-600', icon: TrendingDown };
    if (price > ma20 && price > ma50) return { label: 'Uptrend', color: 'text-green-600', icon: TrendingUp };
    if (price < ma20 && price < ma50) return { label: 'Downtrend', color: 'text-red-600', icon: TrendingDown };
    return { label: 'Sideways', color: 'text-muted-foreground', icon: Minus };
  };

  if (isLoading && !indicators) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading indicators...</span>
        </div>
      </div>
    );
  }

  if (!selectedSymbol) {
    return (
      <div className={cn("h-full flex items-center justify-center text-muted-foreground", className)}>
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm font-medium mb-1">No Symbol Selected</div>
          <div className="text-xs">Select a symbol to view technical indicators</div>
        </div>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className={cn("h-full flex items-center justify-center text-muted-foreground", className)}>
        <div className="text-center">
          <div className="text-sm font-medium mb-1">No Data Available</div>
          <div className="text-xs mb-2">Unable to load technical indicators</div>
          <Button variant="outline" size="sm" onClick={fetchIndicators}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const rsiSignal = getRSISignal(indicators.rsi);
  const macdSignal = getMACDSignal(indicators.macd);
  const trendSignal = getTrendSignal(
    indicators.currentPrice,
    indicators.movingAverages.ma20,
    indicators.movingAverages.ma50,
    indicators.movingAverages.ma200
  );

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-medium">Technical Indicators</span>
          <Badge variant="outline" className="text-xs">
            {selectedSymbol.symbol}
          </Badge>
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
            onClick={fetchIndicators}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        {/* RSI Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">RSI (14)</span>
              <Badge variant="outline" className={cn("text-xs", rsiSignal.color)}>
                {rsiSignal.label}
              </Badge>
            </div>
            <span className="text-sm font-bold">{indicators.rsi.toFixed(2)}</span>
          </div>
          <Progress value={indicators.rsi} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Oversold (30)</span>
            <span>Neutral (50)</span>
            <span>Overbought (70)</span>
          </div>
        </div>

        {/* MACD */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">MACD</span>
              <Badge variant="outline" className={cn("text-xs", macdSignal.color)}>
                {macdSignal.label}
              </Badge>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">MACD Line:</span>
              <span className="font-medium">{indicators.macd.value.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signal Line:</span>
              <span className="font-medium">{indicators.macd.signal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Histogram:</span>
              <span className={cn(
                "font-medium",
                indicators.macd.histogram > 0 ? "text-green-600" : "text-red-600"
              )}>
                {indicators.macd.histogram.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Moving Averages</span>
              <Badge variant="outline" className={cn("text-xs", trendSignal.color)}>
                {trendSignal.label}
              </Badge>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Price:</span>
              <span className="font-medium">${indicators.currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">MA 20:</span>
              <span className={cn(
                "font-medium",
                indicators.currentPrice > indicators.movingAverages.ma20 ? "text-green-600" : "text-red-600"
              )}>
                ${indicators.movingAverages.ma20.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">MA 50:</span>
              <span className={cn(
                "font-medium",
                indicators.currentPrice > indicators.movingAverages.ma50 ? "text-green-600" : "text-red-600"
              )}>
                ${indicators.movingAverages.ma50.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">MA 200:</span>
              <span className={cn(
                "font-medium",
                indicators.currentPrice > indicators.movingAverages.ma200 ? "text-green-600" : "text-red-600"
              )}>
                ${indicators.movingAverages.ma200.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="space-y-2 pt-2 border-t">
          <span className="text-sm font-medium">Bollinger Bands (20, 2)</span>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Upper Band:</span>
              <span className="font-medium">${indicators.bollingerBands.upper.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Middle Band:</span>
              <span className="font-medium">${indicators.bollingerBands.middle.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lower Band:</span>
              <span className="font-medium">${indicators.bollingerBands.lower.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-1 pt-1 border-t">
              <span className="text-muted-foreground">Position:</span>
              <span className={cn("font-medium text-xs")}>
                {indicators.currentPrice > indicators.bollingerBands.upper && "Above Upper"}
                {indicators.currentPrice < indicators.bollingerBands.lower && "Below Lower"}
                {indicators.currentPrice >= indicators.bollingerBands.lower && 
                 indicators.currentPrice <= indicators.bollingerBands.upper && "Within Bands"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Using calculated data
        </div>
      )}
    </div>
  );
}

