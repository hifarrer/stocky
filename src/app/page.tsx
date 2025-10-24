'use client';

import React, { useState } from 'react';
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
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dashboard = useDashboard();
  const { showModal, closeModal } = useWelcomeModal();
  const { hasPortfolioAccess } = usePlan();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      
      {/* Plan Indicator */}
      <div className="mb-4 flex justify-end">
        <PlanIndicator />
      </div>

      <DashboardLayout>
        {/* Price Chart Widget - Takes up 2x2 space on desktop */}
        <ErrorBoundary widgetName="Price Chart">
          <PriceChartWidget>
            <PriceChart height={400} showControls={true} />
          </PriceChartWidget>
        </ErrorBoundary>

        {/* Ticker Snapshot Widget */}
        <ErrorBoundary widgetName="Ticker Snapshot">
          <TickerSnapshotWidget>
            <TickerSnapshot />
          </TickerSnapshotWidget>
        </ErrorBoundary>

        {/* Crypto Portfolio Widget - Premium Only */}
        {hasPortfolioAccess && (
          <ErrorBoundary widgetName="Crypto Portfolio">
            <PortfolioWidgetWrapper>
              <CryptoPortfolioWidget />
            </PortfolioWidgetWrapper>
          </ErrorBoundary>
        )}

        {/* Stock Portfolio Widget - Premium Only */}
        {hasPortfolioAccess && (
          <ErrorBoundary widgetName="Stock Portfolio">
            <PortfolioWidgetWrapper>
              <StockPortfolioWidget />
            </PortfolioWidgetWrapper>
          </ErrorBoundary>
        )}

        {/* Market Heatmap Widget */}
        <ErrorBoundary widgetName="Market Heatmap">
          <MarketHeatmapWidget>
            <MarketHeatmap marketType="stocks" maxItems={20} />
          </MarketHeatmapWidget>
        </ErrorBoundary>

        {/* Crypto Heatmap Widget */}
        <ErrorBoundary widgetName="Crypto Heatmap">
          <CryptoHeatmapWidget>
            <CryptoHeatmap maxItems={20} />
          </CryptoHeatmapWidget>
        </ErrorBoundary>

        {/* Top Movers Widget */}
        <ErrorBoundary widgetName="Top Movers">
          <TopMoversWidget>
            <TopMovers maxItems={10} />
          </TopMoversWidget>
        </ErrorBoundary>

        {/* Technical Indicators Widget */}
        <ErrorBoundary widgetName="Technical Indicators">
          <TechnicalIndicatorsWidget>
            <TechnicalIndicators />
          </TechnicalIndicatorsWidget>
        </ErrorBoundary>

        {/* Sector Performance Widget */}
        <ErrorBoundary widgetName="Sector Performance">
          <SectorPerformanceWidget>
            <SectorPerformance />
          </SectorPerformanceWidget>
        </ErrorBoundary>

        {/* Market Sentiment Widget */}
        <ErrorBoundary widgetName="Market Sentiment">
          <MarketSentimentWidget>
            <MarketSentiment />
          </MarketSentimentWidget>
        </ErrorBoundary>

        {/* Social Sentiment Widget */}
        <ErrorBoundary widgetName="Social Sentiment">
          <SocialSentimentWidget>
            <SocialSentiment />
          </SocialSentimentWidget>
        </ErrorBoundary>

        {/* News Widget */}
        <ErrorBoundary widgetName="News">
          <NewsWidget>
            <NewsWidgetComponent maxArticles={10} showImages={false} />
          </NewsWidget>
        </ErrorBoundary>

        {/* Economic Calendar Widget */}
        <ErrorBoundary widgetName="Economic Calendar">
          <EconomicCalendarWidget>
            <EconomicCalendar maxEvents={10} />
          </EconomicCalendarWidget>
        </ErrorBoundary>
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
