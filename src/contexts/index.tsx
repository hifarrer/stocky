'use client';

import React, { ReactNode } from 'react';
import { SymbolProvider, useSymbol } from './SymbolContext';
import { WebSocketProvider, useWebSocket } from './WebSocketContext';
import { UserPreferencesProvider, useUserPreferences } from './UserPreferencesContext';
import { AuthProvider } from './AuthContext';
import { PlanProvider } from './PlanContext';
import { TickerSymbol, MarketType } from '../types';

// Export individual contexts
export { SymbolProvider, useSymbol } from './SymbolContext';
export { WebSocketProvider, useWebSocket } from './WebSocketContext';
export { UserPreferencesProvider, useUserPreferences, useTheme, useWatchlist } from './UserPreferencesContext';
export { AuthProvider, useAuth } from './AuthContext';
export { PlanProvider, usePlan } from './PlanContext';

// Combined provider for the entire application
interface AppProvidersProps {
  children: ReactNode;
  apiKey: string;
  userId?: string;
  autoConnectWebSocket?: boolean;
}

export function AppProviders({ 
  children, 
  apiKey, 
  userId, 
  autoConnectWebSocket = false 
}: AppProvidersProps) {
  return (
    <AuthProvider>
      <PlanProvider>
        <UserPreferencesProvider userId={userId}>
          <SymbolProvider apiKey={apiKey}>
            <WebSocketProvider apiKey={apiKey} autoConnect={autoConnectWebSocket}>
              {children}
            </WebSocketProvider>
          </SymbolProvider>
        </UserPreferencesProvider>
      </PlanProvider>
    </AuthProvider>
  );
}

// Hook to use multiple contexts together
export function useMarketData() {
  const symbol = useSymbol();
  const webSocket = useWebSocket();
  const preferences = useUserPreferences();

  return {
    // Symbol context
    selectedSymbol: symbol.selectedSymbol,
    searchSymbols: symbol.searchSymbols,
    selectSymbol: symbol.selectSymbol,
    
    // WebSocket context
    isConnected: webSocket.isConnected,
    latestPrices: webSocket.latestPrices,
    subscribeToTicker: webSocket.subscribeToTicker,
    
    // User preferences
    watchlist: preferences.watchlist,
    defaultSymbol: preferences.defaultSymbol,
    chartTimeframe: preferences.chartTimeframe,
  };
}

// Hook for dashboard-specific functionality
export function useDashboard() {
  const symbol = useSymbol();
  const webSocket = useWebSocket();
  const preferences = useUserPreferences();

  // Auto-subscribe to selected symbol
  React.useEffect(() => {
    if (symbol.selectedSymbol && webSocket.isConnected) {
      webSocket.subscribeToTicker(symbol.selectedSymbol.symbol).catch(error => {
        console.error('Failed to subscribe to ticker:', error);
        // Could add user notification here
      });
    }
  }, [symbol.selectedSymbol, webSocket.isConnected, webSocket.subscribeToTicker]);

  // Auto-subscribe to watchlist
  React.useEffect(() => {
    if (preferences.watchlist.length > 0 && webSocket.isConnected) {
      webSocket.subscribeToMultipleTickers(preferences.watchlist).catch(error => {
        console.error('Failed to subscribe to watchlist:', error);
        // Could add user notification here
      });
    }
  }, [preferences.watchlist, webSocket.isConnected, webSocket.subscribeToMultipleTickers]);

  return {
    // Current state
    selectedSymbol: symbol.selectedSymbol,
    isWebSocketConnected: webSocket.isConnected,
    watchlist: preferences.watchlist,
    
    // Actions
    selectSymbol: (newSymbol: { symbol: string; name?: string; market?: string }) => {
      const tickerSymbol: TickerSymbol = {
        symbol: newSymbol.symbol,
        name: newSymbol.name,
        market: (newSymbol.market as MarketType) || 'stocks',
      };
      symbol.selectSymbol(tickerSymbol);
      preferences.setDefaultSymbol(newSymbol.symbol);
    },
    
    // Data
    getLatestPrice: webSocket.getLatestPrice,
    getPriceHistory: webSocket.getPriceHistory,
    
    // Preferences
    chartTimeframe: preferences.chartTimeframe,
    setChartTimeframe: preferences.setChartTimeframe,
    
    // Theme
    isDarkMode: preferences.themePreferences.darkMode,
    toggleDarkMode: preferences.toggleDarkMode,
  };
}