'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PortfolioChartProps {
  symbol: string;
  marketType: 'stocks' | 'crypto' | 'forex';
  className?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
  }[];
}

export function PortfolioChart({ symbol, marketType, className }: PortfolioChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine the timeframe based on market type
      const timeframe = marketType === 'crypto' ? '1h' : '1d';
      
      const response = await fetch(`/api/historical/${symbol}?timespan=day&timespan_multiplier=1&limit=30`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch chart data');
      }

      const results = data.data.results || [];
      if (results.length === 0) {
        throw new Error('No chart data available');
      }

      // Process the data for the chart
      const labels = results.map((item: { t: number }) => {
        const date = new Date(item.t);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const prices = results.map((item: { c: number }) => item.c); // Close price

      // Determine colors based on price trend
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const isPositive = lastPrice >= firstPrice;
      
      const borderColor = isPositive ? '#10b981' : '#ef4444';
      const backgroundColor = isPositive 
        ? 'rgba(16, 185, 129, 0.1)' 
        : 'rgba(239, 68, 68, 0.1)';

      setChartData({
        labels,
        datasets: [
          {
            label: symbol,
            data: prices,
            borderColor,
            backgroundColor,
            fill: true,
            tension: 0.4,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load chart');
    } finally {
      setLoading(false);
    }
  }, [symbol, marketType]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center text-xs text-muted-foreground ${className}`}>
        No data
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center text-xs text-muted-foreground ${className}`}>
        Loading...
      </div>
    );
  }

  return (
    <div className={`h-12 ${className}`}>
      <Line data={chartData} options={options} />
    </div>
  );
}
