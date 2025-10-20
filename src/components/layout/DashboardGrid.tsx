'use client';

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardGridProps {
  children: React.ReactNode;
  className?: string;
}

// Layout version - increment this when changing default layouts to force reset
const LAYOUT_VERSION = 7;

// Default layout configuration
const defaultLayouts = {
  lg: [
    { i: 'price-chart', x: 0, y: 0, w: 2, h: 10, minW: 2, minH: 8 },
    { i: 'ticker-snapshot', x: 2, y: 0, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'crypto-portfolio-widget', x: 0, y: 10, w: 1, h: 15, minW: 1, minH: 12 },
    { i: 'stock-portfolio-widget', x: 1, y: 10, w: 1, h: 15, minW: 1, minH: 12 },
    { i: 'market-heatmap', x: 2, y: 10, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'crypto-heatmap', x: 2, y: 20, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'top-movers', x: 0, y: 25, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'technical-indicators', x: 1, y: 25, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'sector-performance', x: 2, y: 30, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'market-sentiment', x: 0, y: 35, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'social-sentiment', x: 1, y: 35, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'news-widget', x: 2, y: 40, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'economic-calendar', x: 0, y: 45, w: 1, h: 10, minW: 1, minH: 8 },
  ],
  md: [
    { i: 'price-chart', x: 0, y: 0, w: 2, h: 10, minW: 2, minH: 8 },
    { i: 'ticker-snapshot', x: 0, y: 10, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'crypto-portfolio-widget', x: 1, y: 10, w: 1, h: 15, minW: 1, minH: 12 },
    { i: 'stock-portfolio-widget', x: 0, y: 25, w: 1, h: 15, minW: 1, minH: 12 },
    { i: 'market-heatmap', x: 0, y: 20, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'crypto-heatmap', x: 1, y: 20, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'top-movers', x: 0, y: 30, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'technical-indicators', x: 1, y: 30, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'sector-performance', x: 0, y: 40, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'market-sentiment', x: 1, y: 40, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'social-sentiment', x: 0, y: 50, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'news-widget', x: 1, y: 50, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'economic-calendar', x: 0, y: 60, w: 1, h: 10, minW: 1, minH: 8 },
  ],
  sm: [
    { i: 'price-chart', x: 0, y: 0, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'ticker-snapshot', x: 0, y: 10, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'crypto-portfolio-widget', x: 0, y: 20, w: 1, h: 15, minW: 1, minH: 12 },
    { i: 'stock-portfolio-widget', x: 0, y: 35, w: 1, h: 15, minW: 1, minH: 12 },
    { i: 'market-heatmap', x: 0, y: 30, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'crypto-heatmap', x: 0, y: 40, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'top-movers', x: 0, y: 50, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'technical-indicators', x: 0, y: 60, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'sector-performance', x: 0, y: 70, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'market-sentiment', x: 0, y: 80, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'social-sentiment', x: 0, y: 90, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'news-widget', x: 0, y: 100, w: 1, h: 10, minW: 1, minH: 8 },
    { i: 'economic-calendar', x: 0, y: 110, w: 1, h: 10, minW: 1, minH: 8 },
  ],
};

export function DashboardGrid({ children, className = '' }: DashboardGridProps) {
  const [layouts, setLayouts] = useState(defaultLayouts);
  const [mounted, setMounted] = useState(false);

  // Load saved layout from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedVersion = localStorage.getItem('dashboard-layout-version');
      const savedLayouts = localStorage.getItem('dashboard-layout');
      
      // Check if we need to reset due to version mismatch
      if (savedVersion !== String(LAYOUT_VERSION)) {
        console.log('Layout version mismatch, resetting to defaults');
        localStorage.setItem('dashboard-layout-version', String(LAYOUT_VERSION));
        localStorage.removeItem('dashboard-layout');
        setLayouts(defaultLayouts);
      } else if (savedLayouts) {
        setLayouts(JSON.parse(savedLayouts));
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
    }
  }, []);

  // Save layout to localStorage when it changes
  const handleLayoutChange = (layout: Layout[], allLayouts: Record<string, Layout[]>) => {
    try {
      localStorage.setItem('dashboard-layout', JSON.stringify(allLayouts));
      setLayouts(allLayouts as typeof layouts);
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  };

  // Reset layout to default
  const handleResetLayout = () => {
    setLayouts(defaultLayouts);
    localStorage.removeItem('dashboard-layout');
    localStorage.setItem('dashboard-layout-version', String(LAYOUT_VERSION));
  };

  // Don't render until mounted to avoid SSR issues
  if (!mounted) {
    return (
      <div className={`grid gap-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children}
        </div>
      </div>
    );
  }

  // Convert children array to object with keys
  const childrenArray = React.Children.toArray(children);
  const widgetKeys = [
    'price-chart',
    'ticker-snapshot',
    'crypto-portfolio-widget',
    'stock-portfolio-widget',
    'market-heatmap',
    'crypto-heatmap',
    'top-movers',
    'technical-indicators',
    'sector-performance',
    'market-sentiment',
    'social-sentiment',
    'news-widget',
    'economic-calendar',
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Reset Layout Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetLayout}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Layout
        </Button>
      </div>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 768, sm: 480 }}
        cols={{ lg: 3, md: 2, sm: 1 }}
        rowHeight={30}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".widget-drag-handle"
      >
        {childrenArray.map((child, index) => (
          <div key={widgetKeys[index]} className="widget-container">
            {child}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

interface WidgetProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Widget({ children, className = '', title, size = 'md' }: WidgetProps) {
  return (
    <div className={`
      relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm
      h-full w-full
      ${className}
    `}>
      {title && (
        <div className="border-b px-4 py-3 flex items-center justify-between widget-drag-handle cursor-move hover:bg-muted/50 transition-colors">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-xs text-muted-foreground">Drag to reorder</div>
        </div>
      )}
      <div className="p-4 flex flex-col overflow-y-auto" style={{ height: 'calc(100% - 3.5rem)' }}>
        {children}
      </div>
    </div>
  );
}

// Specific widget containers for different sections
export function PriceChartWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Price Chart">
      {children}
    </Widget>
  );
}

export function TickerSnapshotWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Ticker Info">
      {children}
    </Widget>
  );
}

export function MarketHeatmapWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Market Heatmap">
      {children}
    </Widget>
  );
}

export function CryptoHeatmapWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Crypto Heatmap">
      {children}
    </Widget>
  );
}

export function NewsWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Latest News">
      {children}
    </Widget>
  );
}

export function EconomicCalendarWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Economic Calendar">
      {children}
    </Widget>
  );
}

export function TopMoversWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Top Movers">
      {children}
    </Widget>
  );
}

export function TechnicalIndicatorsWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Technical Indicators">
      {children}
    </Widget>
  );
}

export function SectorPerformanceWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Sector Performance">
      {children}
    </Widget>
  );
}

export function MarketSentimentWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Market Sentiment">
      {children}
    </Widget>
  );
}

export function SocialSentimentWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Social Sentiment">
      {children}
    </Widget>
  );
}

export function PortfolioWidget({ children }: { children: React.ReactNode }) {
  return (
    <Widget title="Portfolio">
      {children}
    </Widget>
  );
}

// Layout container for the entire dashboard
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <main className="container mx-auto px-4 py-6">
      <DashboardGrid>
        {children}
      </DashboardGrid>
    </main>
  );
}
