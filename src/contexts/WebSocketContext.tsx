'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode, useCallback } from 'react';
import { WebSocketState } from '@/types';
import { WebSocketMessage } from '@/types/polygon';
import { PolygonWebSocketClient, WebSocketEventHandlers } from '@/lib/polygon/websocket';

interface WebSocketContextState extends WebSocketState {
  client: PolygonWebSocketClient | null;
  latestPrices: { [symbol: string]: number };
  priceHistory: { [symbol: string]: Array<{ price: number; timestamp: number }> };
  connectionAttempts: number;
  lastReconnectTime: number | null;
}

type WebSocketAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_CLIENT'; payload: PolygonWebSocketClient | null }
  | { type: 'ADD_SUBSCRIPTION'; payload: string }
  | { type: 'REMOVE_SUBSCRIPTION'; payload: string }
  | { type: 'CLEAR_SUBSCRIPTIONS' }
  | { type: 'SET_LAST_MESSAGE'; payload: WebSocketMessage }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INCREMENT_RETRIES' }
  | { type: 'RESET_RETRIES' }
  | { type: 'UPDATE_PRICE'; payload: { symbol: string; price: number; timestamp: number } }
  | { type: 'SET_CONNECTION_ATTEMPTS'; payload: number }
  | { type: 'SET_LAST_RECONNECT_TIME'; payload: number };

const initialState: WebSocketContextState = {
  isConnected: false,
  client: null,
  subscribedSymbols: new Set(),
  lastMessage: undefined,
  connectionRetries: 0,
  error: undefined,
  latestPrices: {},
  priceHistory: {},
  connectionAttempts: 0,
  lastReconnectTime: null,
};

function webSocketReducer(state: WebSocketContextState, action: WebSocketAction): WebSocketContextState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
        error: action.payload ? undefined : state.error,
      };

    case 'SET_CLIENT':
      return {
        ...state,
        client: action.payload,
      };

    case 'ADD_SUBSCRIPTION':
      const newSubscriptions = new Set(state.subscribedSymbols);
      newSubscriptions.add(action.payload);
      return {
        ...state,
        subscribedSymbols: newSubscriptions,
      };

    case 'REMOVE_SUBSCRIPTION':
      const updatedSubscriptions = new Set(state.subscribedSymbols);
      updatedSubscriptions.delete(action.payload);
      return {
        ...state,
        subscribedSymbols: updatedSubscriptions,
      };

    case 'CLEAR_SUBSCRIPTIONS':
      return {
        ...state,
        subscribedSymbols: new Set(),
      };

    case 'SET_LAST_MESSAGE':
      return {
        ...state,
        lastMessage: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload || undefined,
      };

    case 'INCREMENT_RETRIES':
      return {
        ...state,
        connectionRetries: state.connectionRetries + 1,
      };

    case 'RESET_RETRIES':
      return {
        ...state,
        connectionRetries: 0,
      };

    case 'UPDATE_PRICE':
      const { symbol, price, timestamp } = action.payload;
      const currentHistory = state.priceHistory[symbol] || [];
      const newHistory = [...currentHistory, { price, timestamp }].slice(-100); // Keep last 100 prices

      return {
        ...state,
        latestPrices: {
          ...state.latestPrices,
          [symbol]: price,
        },
        priceHistory: {
          ...state.priceHistory,
          [symbol]: newHistory,
        },
      };

    case 'SET_CONNECTION_ATTEMPTS':
      return {
        ...state,
        connectionAttempts: action.payload,
      };

    case 'SET_LAST_RECONNECT_TIME':
      return {
        ...state,
        lastReconnectTime: action.payload,
      };

    default:
      return state;
  }
}

interface WebSocketContextType extends WebSocketContextState {
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribeToTicker: (ticker: string) => Promise<void>;
  unsubscribeFromTicker: (ticker: string) => Promise<void>;
  subscribeToMultipleTickers: (tickers: string[]) => Promise<void>;
  getLatestPrice: (symbol: string) => number | null;
  getPriceHistory: (symbol: string) => Array<{ price: number; timestamp: number }>;
  isTickerSubscribed: (ticker: string) => boolean;
  getConnectionStatus: () => {
    connected: boolean;
    authenticated: boolean;
    subscribedChannels: string[];
    reconnectAttempts: number;
  };
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  apiKey: string;
  autoConnect?: boolean;
}

export function WebSocketProvider({ children, apiKey, autoConnect = false }: WebSocketProviderProps) {
  const [state, dispatch] = useReducer(webSocketReducer, initialState);

  const createClient = useCallback(() => {
    const handlers: WebSocketEventHandlers = {
      onOpen: () => {
        // Don't set connected to true until authentication completes
        dispatch({ type: 'RESET_RETRIES' });
        dispatch({ type: 'SET_ERROR', payload: null });
      },

      onClose: (event) => {
        dispatch({ type: 'SET_CONNECTED', payload: false });
        if (!event.wasClean) {
          dispatch({ type: 'SET_ERROR', payload: 'Connection lost' });
        }
      },

      onError: () => {
        dispatch({ type: 'SET_CONNECTED', payload: false });
        dispatch({ type: 'SET_ERROR', payload: 'WebSocket error occurred' });
      },

      onMessage: (message) => {
        dispatch({ type: 'SET_LAST_MESSAGE', payload: message });
        
        // Update price data based on message type
        if ((message.ev === 'T' || message.ev === 'A' || message.ev === 'AM') && message.sym) {
          // Trade or aggregate message
          const price = 'p' in message ? message.p : ('c' in message ? message.c : 0);
          const symbol = message.sym;
          const timestamp = 't' in message ? message.t : Date.now();

          if (price && symbol) {
            dispatch({ 
              type: 'UPDATE_PRICE', 
              payload: { symbol, price, timestamp } 
            });
          }
        }
      },

      onReconnect: (attempt) => {
        dispatch({ type: 'INCREMENT_RETRIES' });
        dispatch({ type: 'SET_CONNECTION_ATTEMPTS', payload: attempt });
        dispatch({ type: 'SET_LAST_RECONNECT_TIME', payload: Date.now() });
      },

      onMaxReconnectAttemptsReached: () => {
        dispatch({ type: 'SET_ERROR', payload: 'Maximum reconnection attempts reached' });
      },

      onAuthenticated: () => {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
      },

      onAuthenticationFailed: (error) => {
        dispatch({ type: 'SET_ERROR', payload: `Authentication failed: ${error}` });
      },
    };

    const client = new PolygonWebSocketClient(
      {
        apiKey,
        wsUrl: 'wss://socket.polygon.io/stocks',
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
      },
      handlers
    );

    dispatch({ type: 'SET_CLIENT', payload: client });
    return client;
  }, [apiKey]);

  // Initialize client on mount
  useEffect(() => {
    const client = createClient();
    
    if (autoConnect) {
      client.connect().catch(error => {
        console.error('Auto-connect failed:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to auto-connect' });
      });
    }

    return () => {
      client.disconnect();
    };
  }, [createClient, autoConnect]);

  const connect = async (): Promise<void> => {
    if (!state.client) {
      const client = createClient();
      await client.connect();
    } else if (!state.isConnected) {
      await state.client.connect();
    }
  };

  const disconnect = (): void => {
    if (state.client) {
      state.client.disconnect();
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'CLEAR_SUBSCRIPTIONS' });
    }
  };

  const subscribeToTicker = async (ticker: string, retryCount = 0): Promise<void> => {
    if (!state.client) {
      throw new Error('WebSocket client not initialized');
    }

    if (!state.isConnected) {
      throw new Error('WebSocket not connected');
    }

    // Check if client is authenticated
    const status = state.client.getStatus();
    if (!status.authenticated) {
      // If not authenticated and we haven't retried too many times, wait and retry
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return subscribeToTicker(ticker, retryCount + 1);
      }
      throw new Error('WebSocket not authenticated after retries');
    }

    const upperTicker = ticker.toUpperCase();
    
    try {
      // Subscribe to multiple data types for the ticker
      await state.client.subscribeToAll([upperTicker]);
      dispatch({ type: 'ADD_SUBSCRIPTION', payload: upperTicker });
    } catch (error) {
      // If subscription fails and we haven't retried too many times, wait and retry
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return subscribeToTicker(ticker, retryCount + 1);
      }
      throw error;
    }
  };

  const unsubscribeFromTicker = async (ticker: string): Promise<void> => {
    if (!state.client || !state.isConnected) {
      return;
    }

    const upperTicker = ticker.toUpperCase();
    
    await state.client.unsubscribeFromTickers([upperTicker]);
    dispatch({ type: 'REMOVE_SUBSCRIPTION', payload: upperTicker });
  };

  const subscribeToMultipleTickers = async (tickers: string[], retryCount = 0): Promise<void> => {
    if (!state.client) {
      throw new Error('WebSocket client not initialized');
    }

    if (!state.isConnected) {
      throw new Error('WebSocket not connected');
    }

    // Check if client is authenticated
    const status = state.client.getStatus();
    if (!status.authenticated) {
      // If not authenticated and we haven't retried too many times, wait and retry
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return subscribeToMultipleTickers(tickers, retryCount + 1);
      }
      throw new Error('WebSocket not authenticated after retries');
    }

    const upperTickers = tickers.map(t => t.toUpperCase());
    
    try {
      await state.client.subscribeToAll(upperTickers);
      
      upperTickers.forEach(ticker => {
        dispatch({ type: 'ADD_SUBSCRIPTION', payload: ticker });
      });
    } catch (error) {
      // If subscription fails and we haven't retried too many times, wait and retry
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return subscribeToMultipleTickers(tickers, retryCount + 1);
      }
      throw error;
    }
  };

  const getLatestPrice = (symbol: string): number | null => {
    return state.latestPrices[symbol.toUpperCase()] || null;
  };

  const getPriceHistory = (symbol: string): Array<{ price: number; timestamp: number }> => {
    return state.priceHistory[symbol.toUpperCase()] || [];
  };

  const isTickerSubscribed = (ticker: string): boolean => {
    return state.subscribedSymbols.has(ticker.toUpperCase());
  };

  const getConnectionStatus = () => {
    if (!state.client) {
      return {
        connected: false,
        authenticated: false,
        subscribedChannels: [],
        reconnectAttempts: 0,
      };
    }

    return state.client.getStatus();
  };

  // Auto-cleanup subscriptions when symbols are removed
  useEffect(() => {
    const cleanup = () => {
      if (state.client && state.subscribedSymbols.size > 0) {
        // Clean up old price history (keep only recent data)
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        
        Object.keys(state.priceHistory).forEach(symbol => {
          const history = state.priceHistory[symbol];
          const recentHistory = history.filter(entry => entry.timestamp > cutoffTime);
          
          if (recentHistory.length !== history.length) {
            dispatch({
              type: 'UPDATE_PRICE',
              payload: {
                symbol,
                price: recentHistory[recentHistory.length - 1]?.price || 0,
                timestamp: Date.now(),
              },
            });
          }
        });
      }
    };

    // Run cleanup every 5 minutes
    const cleanupInterval = setInterval(cleanup, 5 * 60 * 1000);
    
    return () => clearInterval(cleanupInterval);
  }, [state.priceHistory, state.client, state.subscribedSymbols]);

  const value: WebSocketContextType = {
    ...state,
    connect,
    disconnect,
    subscribeToTicker,
    unsubscribeFromTicker,
    subscribeToMultipleTickers,
    getLatestPrice,
    getPriceHistory,
    isTickerSubscribed,
    getConnectionStatus,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}