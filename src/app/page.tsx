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
        <PriceChartWidget>
          <PriceChart height={400} showControls={true} />
        </PriceChartWidget>

        {/* Ticker Snapshot Widget */}
        <TickerSnapshotWidget>
          <TickerSnapshot />
        </TickerSnapshotWidget>

        {/* Crypto Portfolio Widget - Premium Only */}
        {hasPortfolioAccess && (
          <PortfolioWidgetWrapper>
            <CryptoPortfolioWidget />
          </PortfolioWidgetWrapper>
        )}

        {/* Stock Portfolio Widget - Premium Only */}
        {hasPortfolioAccess && (
          <PortfolioWidgetWrapper>
            <StockPortfolioWidget />
          </PortfolioWidgetWrapper>
        )}

        {/* Market Heatmap Widget */}
        <MarketHeatmapWidget>
          <MarketHeatmap marketType="stocks" maxItems={20} />
        </MarketHeatmapWidget>

        {/* Crypto Heatmap Widget */}
        <CryptoHeatmapWidget>
          <CryptoHeatmap maxItems={20} />
        </CryptoHeatmapWidget>

        {/* Top Movers Widget */}
        <TopMoversWidget>
          <TopMovers maxItems={10} />
        </TopMoversWidget>

        {/* Technical Indicators Widget */}
        <TechnicalIndicatorsWidget>
          <TechnicalIndicators />
        </TechnicalIndicatorsWidget>

        {/* Sector Performance Widget */}
        <SectorPerformanceWidget>
          <SectorPerformance />
        </SectorPerformanceWidget>

        {/* Market Sentiment Widget */}
        <MarketSentimentWidget>
          <MarketSentiment />
        </MarketSentimentWidget>

        {/* Social Sentiment Widget */}
        <SocialSentimentWidget>
          <SocialSentiment />
        </SocialSentimentWidget>

        {/* News Widget */}
        <NewsWidget>
          <NewsWidgetComponent maxArticles={10} showImages={false} />
        </NewsWidget>

        {/* Economic Calendar Widget */}
        <EconomicCalendarWidget>
          <EconomicCalendar maxEvents={10} />
        </EconomicCalendarWidget>
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
