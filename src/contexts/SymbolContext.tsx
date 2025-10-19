'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { TickerSymbol, MarketType, SearchState } from '@/types';
import { createPolygonClient } from '@/lib/polygon';

interface SymbolState {
  selectedSymbol: TickerSymbol | null;
  recentSymbols: TickerSymbol[];
  searchState: SearchState;
  symbolHistory: TickerSymbol[];
  favorites: TickerSymbol[];
  marketType: MarketType;
  isLoading: boolean;
  error: string | null;
}

type SymbolAction =
  | { type: 'SET_SELECTED_SYMBOL'; payload: TickerSymbol }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: TickerSymbol[] }
  | { type: 'SET_SEARCH_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_ERROR'; payload: string | null }
  | { type: 'ADD_TO_HISTORY'; payload: TickerSymbol }
  | { type: 'ADD_TO_FAVORITES'; payload: TickerSymbol }
  | { type: 'REMOVE_FROM_FAVORITES'; payload: string }
  | { type: 'SET_MARKET_TYPE'; payload: MarketType }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'LOAD_STORED_DATA'; payload: Partial<SymbolState> };

const initialState: SymbolState = {
  selectedSymbol: null,
  recentSymbols: [],
  searchState: {
    query: '',
    results: [],
    isLoading: false,
    recentSearches: [],
  },
  symbolHistory: [],
  favorites: [],
  marketType: 'stocks',
  isLoading: false,
  error: null,
};

function symbolReducer(state: SymbolState, action: SymbolAction): SymbolState {
  switch (action.type) {
    case 'SET_SELECTED_SYMBOL':
      console.log('SymbolContext: SET_SELECTED_SYMBOL action', action.payload);
      return {
        ...state,
        selectedSymbol: action.payload,
        marketType: action.payload.market,
        error: null,
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchState: {
          ...state.searchState,
          query: action.payload,
        },
      };

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        searchState: {
          ...state.searchState,
          results: action.payload,
        },
      };

    case 'SET_SEARCH_LOADING':
      return {
        ...state,
        searchState: {
          ...state.searchState,
          isLoading: action.payload,
        },
      };

    case 'SET_SEARCH_ERROR':
      return {
        ...state,
        searchState: {
          ...state.searchState,
          error: action.payload,
        },
      };

    case 'ADD_TO_HISTORY':
      const newHistory = [
        action.payload,
        ...state.symbolHistory.filter(s => s.symbol !== action.payload.symbol),
      ].slice(0, 20); // Keep last 20 symbols
      
      return {
        ...state,
        symbolHistory: newHistory,
        recentSymbols: newHistory.slice(0, 5),
      };

    case 'ADD_TO_FAVORITES':
      const isAlreadyFavorite = state.favorites.some(s => s.symbol === action.payload.symbol);
      if (isAlreadyFavorite) return state;
      
      return {
        ...state,
        favorites: [...state.favorites, action.payload],
      };

    case 'REMOVE_FROM_FAVORITES':
      return {
        ...state,
        favorites: state.favorites.filter(s => s.symbol !== action.payload),
      };

    case 'SET_MARKET_TYPE':
      return {
        ...state,
        marketType: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_SEARCH':
      return {
        ...state,
        searchState: {
          ...state.searchState,
          query: '',
          results: [],
          error: null,
        },
      };

    case 'LOAD_STORED_DATA':
      return {
        ...state,
        ...action.payload,
        // Ensure selectedSymbol is never undefined
        selectedSymbol: action.payload.selectedSymbol || state.selectedSymbol,
      };

    default:
      return state;
  }
}

interface SymbolContextType extends SymbolState {
  dispatch: React.Dispatch<SymbolAction>;
  selectSymbol: (symbol: TickerSymbol) => void;
  searchSymbols: (query: string) => Promise<void>;
  addToFavorites: (symbol: TickerSymbol) => void;
  removeFromFavorites: (symbol: string) => void;
  clearSearch: () => void;
  validateSymbol: (symbol: string) => Promise<TickerSymbol | null>;
  getPopularSymbols: () => Promise<TickerSymbol[]>;
}

const SymbolContext = createContext<SymbolContextType | undefined>(undefined);

interface SymbolProviderProps {
  children: ReactNode;
  apiKey: string;
}

export function SymbolProvider({ children, apiKey }: SymbolProviderProps) {
  const [state, dispatch] = useReducer(symbolReducer, initialState);
  const polygonClient = createPolygonClient(apiKey);

  // Load stored data on mount
  useEffect(() => {
    const loadStoredData = () => {
      try {
        const stored = localStorage.getItem('stocky-symbol-data');
        console.log('SymbolContext: Loading from localStorage:', stored);
        if (stored) {
          const data = JSON.parse(stored);
          console.log('SymbolContext: Parsed stored data:', data);
          dispatch({ type: 'LOAD_STORED_DATA', payload: data });
          
          // If no selected symbol in stored data, set default
          if (!data.selectedSymbol) {
            const defaultSymbol: TickerSymbol = {
              symbol: 'AAPL',
              name: 'Apple Inc.',
              market: 'stocks',
              type: 'stock',
              exchange: 'NASDAQ',
              sector: 'Technology',
              currency: 'USD',
              country: 'US',
              isActive: true,
              lastUpdated: new Date().toISOString(),
            };
            console.log('SymbolContext: Setting default symbol from stored data', defaultSymbol);
            dispatch({ type: 'SET_SELECTED_SYMBOL', payload: defaultSymbol });
          }
        } else {
          // If no stored data, set a default symbol (AAPL)
          const defaultSymbol: TickerSymbol = {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            market: 'stocks',
            type: 'stock',
            exchange: 'NASDAQ',
            sector: 'Technology',
            currency: 'USD',
            country: 'US',
            isActive: true,
            lastUpdated: new Date().toISOString(),
          };
          console.log('SymbolContext: Setting default symbol (no stored data)', defaultSymbol);
          dispatch({ type: 'SET_SELECTED_SYMBOL', payload: defaultSymbol });
        }
      } catch (error) {
        console.error('Error loading stored symbol data:', error);
        // Set default symbol even if there's an error
        const defaultSymbol: TickerSymbol = {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          market: 'stocks',
          type: 'stock',
          exchange: 'NASDAQ',
          sector: 'Technology',
          currency: 'USD',
          country: 'US',
          isActive: true,
          lastUpdated: new Date().toISOString(),
        };
        console.log('SymbolContext: Setting default symbol (error case)', defaultSymbol);
        dispatch({ type: 'SET_SELECTED_SYMBOL', payload: defaultSymbol });
      }
    };

    loadStoredData();
  }, []);

  // Debug: Log when selectedSymbol changes
  useEffect(() => {
    console.log('SymbolContext: selectedSymbol changed to:', state.selectedSymbol);
  }, [state.selectedSymbol]);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    try {
      const dataToStore = {
        symbolHistory: state.symbolHistory,
        favorites: state.favorites,
        recentSymbols: state.recentSymbols,
        selectedSymbol: state.selectedSymbol,
      };
      localStorage.setItem('stocky-symbol-data', JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving symbol data:', error);
    }
  }, [state.symbolHistory, state.favorites, state.recentSymbols, state.selectedSymbol]);

  const selectSymbol = (symbol: TickerSymbol) => {
    dispatch({ type: 'SET_SELECTED_SYMBOL', payload: symbol });
    dispatch({ type: 'ADD_TO_HISTORY', payload: symbol });
  };

  const searchSymbols = async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'CLEAR_SEARCH' });
      return;
    }

    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    dispatch({ type: 'SET_SEARCH_LOADING', payload: true });
    dispatch({ type: 'SET_SEARCH_ERROR', payload: null });

    try {
      // Call the search API which now uses both Polygon and CoinGecko
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      // Transform API results to TickerSymbol format
      const allResults: TickerSymbol[] = [];
      
      // Add stocks
      if (data.data.stocks) {
        allResults.push(...data.data.stocks.map((ticker: {
          ticker: string;
          name: string;
          sic_description?: string;
        }) => ({
          symbol: ticker.ticker,
          market: 'stocks' as MarketType,
          name: ticker.name,
          sector: ticker.sic_description,
        })));
      }
      
      // Add crypto (now with CoinGecko data)
      if (data.data.cryptos) {
        allResults.push(...data.data.cryptos.map((ticker: {
          ticker: string;
          name: string;
          coin_id?: string;
          market_cap_rank?: number;
        }) => ({
          symbol: ticker.ticker,
          market: 'crypto' as MarketType,
          name: ticker.name,
          coinId: ticker.coin_id,
          marketCapRank: ticker.market_cap_rank,
        })));
      }
      
      // Add forex
      if (data.data.forex) {
        allResults.push(...data.data.forex.map((ticker: {
          ticker: string;
          name: string;
        }) => ({
          symbol: ticker.ticker,
          market: 'forex' as MarketType,
          name: ticker.name,
        })));
      }

      // Deduplicate results - prefer crypto for common tickers like BTC, ETH
      const deduplicatedResults = allResults.reduce((acc, current) => {
        const existing = acc.find(item => item.symbol === current.symbol);
        if (!existing) {
          acc.push(current);
        } else {
          // If duplicate found, prefer crypto over stocks/forex for popular symbols
          const existingIndex = acc.indexOf(existing);
          if (current.market === 'crypto' && existing.market !== 'crypto') {
            acc[existingIndex] = current;
          }
        }
        return acc;
      }, [] as TickerSymbol[]);

      // Sort results by relevance - exact matches first
      const sortedResults = deduplicatedResults.sort((a, b) => {
        const queryUpper = query.toUpperCase().trim();
        const aSymbol = a.symbol.toUpperCase();
        const bSymbol = b.symbol.toUpperCase();
        
        // Exact match gets highest priority
        const aExact = aSymbol === queryUpper ? 0 : 1;
        const bExact = bSymbol === queryUpper ? 0 : 1;
        
        if (aExact !== bExact) return aExact - bExact;
        
        // Starts with query gets second priority
        const aStarts = aSymbol.startsWith(queryUpper) ? 0 : 1;
        const bStarts = bSymbol.startsWith(queryUpper) ? 0 : 1;
        
        if (aStarts !== bStarts) return aStarts - bStarts;
        
        // For crypto, prioritize by market cap rank if available
        if (a.market === 'crypto' && b.market === 'crypto') {
          const aRank = a.marketCapRank || Number.MAX_SAFE_INTEGER;
          const bRank = b.marketCapRank || Number.MAX_SAFE_INTEGER;
          if (aRank !== bRank) return aRank - bRank;
        }
        
        // Sort by symbol length (shorter is better for partial matches)
        if (aSymbol.length !== bSymbol.length) {
          return aSymbol.length - bSymbol.length;
        }
        
        // Maintain original order
        return 0;
      });

      dispatch({ type: 'SET_SEARCH_RESULTS', payload: sortedResults });
    } catch (error) {
      console.error('Search error:', error);
      dispatch({ 
        type: 'SET_SEARCH_ERROR', 
        payload: error instanceof Error ? error.message : 'Search failed' 
      });
    } finally {
      dispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }
  };

  const validateSymbol = async (symbol: string): Promise<TickerSymbol | null> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const isValid = await polygonClient.reference.validateTicker(symbol);
      if (!isValid) return null;

      const details = await polygonClient.reference.getTickerDetails(symbol);
      
      return {
        symbol: details.results.ticker,
        market: details.results.market as MarketType,
        name: details.results.name,
        sector: details.results.sic_description,
        marketCap: details.results.market_cap,
      };
    } catch (error) {
      console.error('Symbol validation error:', error);
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getPopularSymbols = async (): Promise<TickerSymbol[]> => {
    try {
      const popular = await polygonClient.reference.getPopularTickers(20);
      
      return popular.results.map(ticker => ({
        symbol: ticker.ticker,
        market: ticker.market as MarketType,
        name: ticker.name,
        sector: ticker.sic_description,
      }));
    } catch (error) {
      console.error('Error fetching popular symbols:', error);
      return [];
    }
  };

  const addToFavorites = (symbol: TickerSymbol) => {
    dispatch({ type: 'ADD_TO_FAVORITES', payload: symbol });
  };

  const removeFromFavorites = (symbol: string) => {
    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: symbol });
  };

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  const value: SymbolContextType = {
    ...state,
    dispatch,
    selectSymbol,
    searchSymbols,
    addToFavorites,
    removeFromFavorites,
    clearSearch,
    validateSymbol,
    getPopularSymbols,
  };

  return <SymbolContext.Provider value={value}>{children}</SymbolContext.Provider>;
}

export function useSymbol() {
  const context = useContext(SymbolContext);
  if (context === undefined) {
    throw new Error('useSymbol must be used within a SymbolProvider');
  }
  return context;
}