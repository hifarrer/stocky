'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserPreferences, TimeFrame } from '@/types';

interface UserPreferencesState extends Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'> {
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

type UserPreferencesAction =
  | { type: 'SET_DEFAULT_SYMBOL'; payload: string }
  | { type: 'SET_CHART_TIMEFRAME'; payload: TimeFrame }
  | { type: 'SET_THEME_PREFERENCES'; payload: Partial<UserPreferences['themePreferences']> }
  | { type: 'ADD_TO_WATCHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: string }
  | { type: 'SET_WATCHLIST'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_UNSAVED_CHANGES'; payload: boolean }
  | { type: 'LOAD_PREFERENCES'; payload: Partial<UserPreferencesState> }
  | { type: 'RESET_TO_DEFAULTS' };

const defaultThemePreferences = {
  darkMode: true,
  primaryColor: '#00FF88',
  accentColor: '#FF6B6B',
};

const initialState: UserPreferencesState = {
  defaultSymbol: 'AAPL',
  chartTimeframe: '1d',
  themePreferences: defaultThemePreferences,
  watchlist: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
  isLoading: false,
  error: null,
  hasUnsavedChanges: false,
};

function userPreferencesReducer(
  state: UserPreferencesState,
  action: UserPreferencesAction
): UserPreferencesState {
  switch (action.type) {
    case 'SET_DEFAULT_SYMBOL':
      return {
        ...state,
        defaultSymbol: action.payload,
        hasUnsavedChanges: true,
      };

    case 'SET_CHART_TIMEFRAME':
      return {
        ...state,
        chartTimeframe: action.payload,
        hasUnsavedChanges: true,
      };

    case 'SET_THEME_PREFERENCES':
      return {
        ...state,
        themePreferences: {
          ...state.themePreferences,
          ...action.payload,
        },
        hasUnsavedChanges: true,
      };

    case 'ADD_TO_WATCHLIST':
      if (state.watchlist.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        watchlist: [...state.watchlist, action.payload],
        hasUnsavedChanges: true,
      };

    case 'REMOVE_FROM_WATCHLIST':
      return {
        ...state,
        watchlist: state.watchlist.filter(symbol => symbol !== action.payload),
        hasUnsavedChanges: true,
      };

    case 'SET_WATCHLIST':
      return {
        ...state,
        watchlist: action.payload,
        hasUnsavedChanges: true,
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

    case 'SET_UNSAVED_CHANGES':
      return {
        ...state,
        hasUnsavedChanges: action.payload,
      };

    case 'LOAD_PREFERENCES':
      return {
        ...state,
        ...action.payload,
        hasUnsavedChanges: false,
      };

    case 'RESET_TO_DEFAULTS':
      return {
        ...initialState,
        hasUnsavedChanges: true,
      };

    default:
      return state;
  }
}

interface UserPreferencesContextType extends UserPreferencesState {
  setDefaultSymbol: (symbol: string) => void;
  setChartTimeframe: (timeframe: TimeFrame) => void;
  setThemePreferences: (preferences: Partial<UserPreferences['themePreferences']>) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  setWatchlist: (watchlist: string[]) => void;
  toggleDarkMode: () => void;
  savePreferences: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  resetToDefaults: () => void;
  isInWatchlist: (symbol: string) => boolean;
  getWatchlistCount: () => number;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

interface UserPreferencesProviderProps {
  children: ReactNode;
  userId?: string;
}

export function UserPreferencesProvider({ children, userId }: UserPreferencesProviderProps) {
  const [state, dispatch] = useReducer(userPreferencesReducer, initialState);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [userId]);

  // Auto-save preferences when they change (debounced)
  useEffect(() => {
    if (state.hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        savePreferences();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hasUnsavedChanges, state]);

  // Apply theme changes to document
  useEffect(() => {
    const { darkMode, primaryColor, accentColor } = state.themePreferences;
    
    // Toggle dark mode class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Set CSS custom properties for theme colors
    document.documentElement.style.setProperty('--color-primary', primaryColor);
    document.documentElement.style.setProperty('--color-accent', accentColor);
  }, [state.themePreferences]);

  const setDefaultSymbol = (symbol: string) => {
    dispatch({ type: 'SET_DEFAULT_SYMBOL', payload: symbol.toUpperCase() });
  };

  const setChartTimeframe = (timeframe: TimeFrame) => {
    dispatch({ type: 'SET_CHART_TIMEFRAME', payload: timeframe });
  };

  const setThemePreferences = (preferences: Partial<UserPreferences['themePreferences']>) => {
    dispatch({ type: 'SET_THEME_PREFERENCES', payload: preferences });
  };

  const addToWatchlist = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    dispatch({ type: 'ADD_TO_WATCHLIST', payload: upperSymbol });
  };

  const removeFromWatchlist = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    dispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: upperSymbol });
  };

  const setWatchlist = (watchlist: string[]) => {
    const upperWatchlist = watchlist.map(symbol => symbol.toUpperCase());
    dispatch({ type: 'SET_WATCHLIST', payload: upperWatchlist });
  };

  const toggleDarkMode = () => {
    dispatch({ 
      type: 'SET_THEME_PREFERENCES', 
      payload: { darkMode: !state.themePreferences.darkMode } 
    });
  };

  const savePreferences = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Save to localStorage (in a real app, this would be an API call)
      const preferencesToSave = {
        defaultSymbol: state.defaultSymbol,
        chartTimeframe: state.chartTimeframe,
        themePreferences: state.themePreferences,
        watchlist: state.watchlist,
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem('stocky-user-preferences', JSON.stringify(preferencesToSave));
      
      dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
    } catch (error) {
      console.error('Error saving preferences:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to save preferences' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadPreferences = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Load from localStorage (in a real app, this would be an API call)
      const stored = localStorage.getItem('stocky-user-preferences');
      
      if (stored) {
        const preferences = JSON.parse(stored);
        dispatch({ type: 'LOAD_PREFERENCES', payload: preferences });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to load preferences' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resetToDefaults = () => {
    dispatch({ type: 'RESET_TO_DEFAULTS' });
  };

  const isInWatchlist = (symbol: string): boolean => {
    return state.watchlist.includes(symbol.toUpperCase());
  };

  const getWatchlistCount = (): number => {
    return state.watchlist.length;
  };

  const value: UserPreferencesContextType = {
    ...state,
    setDefaultSymbol,
    setChartTimeframe,
    setThemePreferences,
    addToWatchlist,
    removeFromWatchlist,
    setWatchlist,
    toggleDarkMode,
    savePreferences,
    loadPreferences,
    resetToDefaults,
    isInWatchlist,
    getWatchlistCount,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}

// Hook for theme-related preferences
export function useTheme() {
  const { themePreferences, setThemePreferences, toggleDarkMode } = useUserPreferences();
  
  return {
    ...themePreferences,
    setThemePreferences,
    toggleDarkMode,
    isDark: themePreferences.darkMode,
  };
}

// Hook for watchlist management
export function useWatchlist() {
  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    setWatchlist,
    isInWatchlist,
    getWatchlistCount,
  } = useUserPreferences();

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    setWatchlist,
    isInWatchlist,
    getWatchlistCount,
    isEmpty: watchlist.length === 0,
  };
}