/**
 * Widget configuration for refresh intervals and optimization
 * Centralized configuration to manage widget behavior
 */

export const WidgetRefreshIntervals = {
  // Critical real-time widgets (refresh more frequently)
  TICKER_SNAPSHOT: 10000,      // 10 seconds
  PRICE_CHART: 30000,          // 30 seconds
  
  // Important widgets (moderate refresh)
  TOP_MOVERS: 300000,          // 5 minutes
  MARKET_HEATMAP: 300000,      // 5 minutes
  CRYPTO_HEATMAP: 300000,      // 5 minutes
  PORTFOLIO: 60000,            // 1 minute
  
  // Less critical widgets (refresh less frequently)
  NEWS: 600000,                // 10 minutes
  MARKET_SENTIMENT: 600000,    // 10 minutes
  SOCIAL_SENTIMENT: 600000,    // 10 minutes
  SECTOR_PERFORMANCE: 600000,  // 10 minutes
  TECHNICAL_INDICATORS: 300000, // 5 minutes
  ECONOMIC_CALENDAR: 1800000,  // 30 minutes
};

export const WidgetLoadPriority = {
  // Priority 1: Load immediately
  CRITICAL: ['price-chart', 'ticker-snapshot'],
  
  // Priority 2: Load after short delay
  HIGH: ['portfolio', 'top-movers'],
  
  // Priority 3: Load after medium delay
  MEDIUM: ['market-heatmap', 'crypto-heatmap', 'technical-indicators'],
  
  // Priority 4: Load when scrolled into view
  LOW: ['news', 'market-sentiment', 'social-sentiment', 'sector-performance', 'economic-calendar'],
};

/**
 * Get optimized refresh interval based on plan
 */
export function getRefreshInterval(
  widgetType: keyof typeof WidgetRefreshIntervals,
  isPremium: boolean
): number {
  const baseInterval = WidgetRefreshIntervals[widgetType];
  
  // Demo mode - all users get optimal refresh rates
  return baseInterval;
}

/**
 * Get load delay for staggered loading
 */
export function getLoadDelay(widgetType: string): number {
  const { CRITICAL, HIGH, MEDIUM } = WidgetLoadPriority;
  
  if (CRITICAL.includes(widgetType)) {
    return 0;
  }
  
  if (HIGH.includes(widgetType)) {
    return 200;
  }
  
  if (MEDIUM.includes(widgetType)) {
    return 800;
  }
  
  // LOW priority
  return 1600;
}
