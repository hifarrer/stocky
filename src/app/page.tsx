'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import {
  DashboardLayout,
  PriceChartWidget,
  TickerSnapshotWidget,
  MarketHeatmapWidget,
  CryptoHeatmapWidget,
  TopMoversWidget,
  TechnicalIndicatorsWidget,
  SectorPerformanceWidget,
  MarketSentimentWidget,
  SocialSentimentWidget,
  NewsWidget,
  EconomicCalendarWidget,
  PortfolioWidget as PortfolioWidgetWrapper,
} from '@/components/layout';
import { PriceChart, TickerSnapshot, MarketHeatmap, CryptoHeatmap, TopMovers, TechnicalIndicators, SectorPerformance, MarketSentiment, SocialSentiment, NewsWidget as NewsWidgetComponent, EconomicCalendar, CryptoPortfolioWidget, StockPortfolioWidget } from '@/components/widgets';
import { useDashboard, usePlan } from '@/contexts';
import WelcomeModal from '@/components/WelcomeModal';
import { useWelcomeModal } from '@/hooks/useWelcomeModal';
import { PlanIndicator } from '@/components/PlanIndicator';
import { LazyWidget } from '@/components/LazyWidget';

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dashboard = useDashboard();
  const { showModal, closeModal } = useWelcomeModal();
  const { hasPortfolioAccess } = usePlan();

  // Debug: Log widget rendering
  console.log('Dashboard state:', {
    selectedSymbol: dashboard.selectedSymbol,
    isWebSocketConnected: dashboard.isWebSocketConnected,
    watchlist: dashboard.watchlist,
    apiKey: process.env.NEXT_PUBLIC_POLYGON_API_KEY ? 'Set' : 'Missing'
  });
  
  // Debug: Log when symbol changes
  useEffect(() => {
    console.log('Symbol changed:', dashboard.selectedSymbol);
  }, [dashboard.selectedSymbol]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      
      <DashboardLayout>
        {/* Plan Indicator */}
        <div className="mb-4 flex justify-end">
          <PlanIndicator />
        </div>

        {/* Price Chart Widget - Takes up 2x2 space on desktop */}
        <LazyWidget delay={0}>
          <PriceChartWidget>
            <PriceChart height={400} showControls={true} />
          </PriceChartWidget>
        </LazyWidget>

        {/* Ticker Snapshot Widget */}
        <LazyWidget delay={200}>
          <TickerSnapshotWidget>
            <TickerSnapshot />
          </TickerSnapshotWidget>
        </LazyWidget>

        {/* Crypto Portfolio Widget - Premium Only */}
        {hasPortfolioAccess && (
          <LazyWidget delay={400}>
            <PortfolioWidgetWrapper>
              <CryptoPortfolioWidget />
            </PortfolioWidgetWrapper>
          </LazyWidget>
        )}

        {/* Stock Portfolio Widget - Premium Only */}
        {hasPortfolioAccess && (
          <LazyWidget delay={600}>
            <PortfolioWidgetWrapper>
              <StockPortfolioWidget />
            </PortfolioWidgetWrapper>
          </LazyWidget>
        )}

        {/* Market Heatmap Widget */}
        <LazyWidget delay={800}>
          <MarketHeatmapWidget>
            <MarketHeatmap marketType="stocks" maxItems={20} />
          </MarketHeatmapWidget>
        </LazyWidget>

        {/* Crypto Heatmap Widget */}
        <LazyWidget delay={1000}>
          <CryptoHeatmapWidget>
            <CryptoHeatmap maxItems={20} />
          </CryptoHeatmapWidget>
        </LazyWidget>

        {/* Top Movers Widget */}
        <LazyWidget delay={1200}>
          <TopMoversWidget>
            <TopMovers maxItems={10} />
          </TopMoversWidget>
        </LazyWidget>

        {/* Technical Indicators Widget */}
        <LazyWidget delay={1400}>
          <TechnicalIndicatorsWidget>
            <TechnicalIndicators />
          </TechnicalIndicatorsWidget>
        </LazyWidget>

        {/* Sector Performance Widget */}
        <LazyWidget delay={1600}>
          <SectorPerformanceWidget>
            <SectorPerformance />
          </SectorPerformanceWidget>
        </LazyWidget>

        {/* Market Sentiment Widget */}
        <LazyWidget delay={1800}>
          <MarketSentimentWidget>
            <MarketSentiment />
          </MarketSentimentWidget>
        </LazyWidget>

        {/* Social Sentiment Widget */}
        <LazyWidget delay={2000}>
          <SocialSentimentWidget>
            <SocialSentiment />
          </SocialSentimentWidget>
        </LazyWidget>

        {/* News Widget */}
        <LazyWidget delay={2200}>
          <NewsWidget>
            <NewsWidgetComponent maxArticles={10} showImages={false} />
          </NewsWidget>
        </LazyWidget>

        {/* Economic Calendar Widget */}
        <LazyWidget delay={2400}>
          <EconomicCalendarWidget>
            <EconomicCalendar maxEvents={10} />
          </EconomicCalendarWidget>
        </LazyWidget>
      </DashboardLayout>

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 p-2 bg-muted rounded text-xs max-w-xs">
          <div>Selected: {dashboard.selectedSymbol?.symbol || 'None'}</div>
          <div>WebSocket: {dashboard.isWebSocketConnected ? 'Connected' : 'Disconnected'}</div>
          <div>Watchlist: {dashboard.watchlist.length} items</div>
          <div>API Key: {process.env.NEXT_PUBLIC_POLYGON_API_KEY ? 'Set' : 'Missing'}</div>
          <button 
            onClick={() => {
              console.log('Testing API...');
              fetch('/api/ticker/AAPL')
                .then(res => res.json())
                .then(data => console.log('API Test Result:', data))
                .catch(err => console.error('API Test Error:', err));
            }}
            className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            Test API
          </button>
        </div>
      )}

      {/* Welcome Modal */}
      <WelcomeModal isOpen={showModal} onClose={closeModal} />
    </div>
  );
}
