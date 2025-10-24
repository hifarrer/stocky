'use client';

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';
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
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set());

  // Load saved layout from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedVersion = localStorage.getItem('dashboard-layout-version');
      const savedLayouts = localStorage.getItem('dashboard-layout');
      const savedHiddenWidgets = localStorage.getItem('dashboard-hidden-widgets');
      
      // Check if we need to reset due to version mismatch
      if (savedVersion !== String(LAYOUT_VERSION)) {
        console.log('Layout version mismatch, resetting to defaults');
        localStorage.setItem('dashboard-layout-version', String(LAYOUT_VERSION));
        localStorage.removeItem('dashboard-layout');
        localStorage.removeItem('dashboard-hidden-widgets');
        setLayouts(defaultLayouts);
        setHiddenWidgets(new Set());
      } else {
        if (savedLayouts) {
          setLayouts(JSON.parse(savedLayouts));
        }
        if (savedHiddenWidgets) {
          setHiddenWidgets(new Set(JSON.parse(savedHiddenWidgets)));
        }
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
    setHiddenWidgets(new Set());
    localStorage.removeItem('dashboard-layout');
    localStorage.removeItem('dashboard-hidden-widgets');
    localStorage.setItem('dashboard-layout-version', String(LAYOUT_VERSION));
  };

  // Hide a widget
  const handleHideWidget = (widgetId: string) => {
    const newHiddenWidgets = new Set(hiddenWidgets);
    newHiddenWidgets.add(widgetId);
    setHiddenWidgets(newHiddenWidgets);
    localStorage.setItem('dashboard-hidden-widgets', JSON.stringify(Array.from(newHiddenWidgets)));
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

  // Filter out hidden widgets
  const visibleWidgets = childrenArray.filter((_, index) => !hiddenWidgets.has(widgetKeys[index]));
  const visibleKeys = widgetKeys.filter(key => !hiddenWidgets.has(key));

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
      {visibleWidgets.map((child, index) => (
        <div key={visibleKeys[index]} className="widget-container">
          <WidgetHideWrapper 
            widgetId={visibleKeys[index]}
            onHide={() => handleHideWidget(visibleKeys[index])}
          >
            {child}
          </WidgetHideWrapper>
        </div>
      ))}
      </ResponsiveGridLayout>
    </div>
  );
}

// Wrapper component to inject onHide prop into widget components
interface WidgetHideWrapperProps {
  widgetId: string;
  onHide: () => void;
  children: React.ReactNode;
}

function WidgetHideWrapper({ onHide, children }: WidgetHideWrapperProps) {
  // Clone the child element and add the onHide prop
  return React.cloneElement(children as React.ReactElement, { onHide } as Record<string, unknown>);
}

interface WidgetProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onHide?: () => void;
}

export function Widget({ children, className = '', title, onHide }: WidgetProps) {
  return (
    <div className={`
      relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm
      h-full w-full
      ${className}
    `}>
      {title && (
        <div className="border-b px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="widget-drag-handle cursor-move flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="text-xs text-muted-foreground">Drag to reorder</div>
          </div>
          <div className="flex items-center gap-2">
            {onHide && (
              <button
                onClick={onHide}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Close widget"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="p-4 flex flex-col overflow-y-auto" style={{ height: 'calc(100% - 3.5rem)' }}>
        {children}
      </div>
    </div>
  );
}

// Widget wrapper that accepts onHide prop
function WidgetWithHide({ children, title, onHide }: { children: React.ReactNode; title: string; onHide?: () => void }) {
  return (
    <Widget title={title} onHide={onHide}>
      {children}
    </Widget>
  );
}

// Specific widget containers for different sections
export function PriceChartWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Price Chart" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function TickerSnapshotWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Ticker Info" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function MarketHeatmapWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Market Heatmap" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function CryptoHeatmapWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Crypto Heatmap" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function NewsWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Latest News" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function EconomicCalendarWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Economic Calendar" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function TopMoversWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Top Movers" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function TechnicalIndicatorsWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Technical Indicators" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function SectorPerformanceWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Sector Performance" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function MarketSentimentWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Market Sentiment" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function SocialSentimentWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Social Sentiment" onHide={onHide}>
      {children}
    </WidgetWithHide>
  );
}

export function PortfolioWidget({ children, onHide }: { children: React.ReactNode; onHide?: () => void }) {
  return (
    <WidgetWithHide title="Portfolio" onHide={onHide}>
      {children}
    </WidgetWithHide>
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
