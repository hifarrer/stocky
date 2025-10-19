'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Star, TrendingUp, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSymbol, useWatchlist } from '@/contexts';
import { TickerSymbol, MarketType } from '@/types';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onSymbolSelect?: (symbol: TickerSymbol) => void;
}

export function SearchInput({ 
  placeholder = "Search stocks, crypto, forex...", 
  className,
  onSymbolSelect 
}: SearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [marketFilter, setMarketFilter] = useState<MarketType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    searchState, 
    searchSymbols, 
    clearSearch, 
    selectSymbol,
    recentSymbols,
    favorites 
  } = useSymbol();
  
  const { isInWatchlist, addToWatchlist } = useWatchlist();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowRecent(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value.trim()) {
      searchSymbols(value);
      setIsOpen(true);
      setShowRecent(false);
    } else {
      clearSearch();
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (!searchState.query && (recentSymbols.length > 0 || favorites.length > 0)) {
      setShowRecent(true);
      setIsOpen(true);
    } else if (searchState.query && searchState.results.length > 0) {
      setIsOpen(true);
    }
    // Show filters hint on first focus if no recents
    if (!searchState.query && recentSymbols.length === 0 && favorites.length === 0) {
      setShowRecent(false);
      setIsOpen(false);
    }
  };

  const handleSymbolClick = (symbol: TickerSymbol) => {
    selectSymbol(symbol);
    onSymbolSelect?.(symbol);
    setIsOpen(false);
    setShowRecent(false);
    clearSearch();
    inputRef.current?.blur();
  };

  const handleClearSearch = () => {
    clearSearch();
    setIsOpen(false);
    setShowRecent(false);
    inputRef.current?.focus();
  };

  const handleAddToWatchlist = (e: React.MouseEvent, symbol: TickerSymbol) => {
    e.stopPropagation();
    addToWatchlist(symbol.symbol);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleMarketFilterChange = (market: MarketType | 'all') => {
    setMarketFilter(market);
    if (searchState.query) {
      // Re-trigger search with filter
      searchSymbols(searchState.query);
    }
  };

  // Filter results based on selected market
  const filteredResults = marketFilter === 'all' 
    ? searchState.results 
    : searchState.results.filter(r => r.market === marketFilter);

  const getMarketIcon = (market: string) => {
    switch (market) {
      case 'crypto':
        return '₿';
      case 'forex':
        return '€$';
      default:
        return '📈';
    }
  };

  const shouldShowDropdown = isOpen && (
    (showRecent && (recentSymbols.length > 0 || favorites.length > 0)) ||
    (!showRecent && filteredResults.length > 0)
  );

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-md", className)}>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="pl-10 pr-10"
            value={searchState.query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
          
          {/* Loading indicator */}
          {searchState.isLoading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          )}
          
          {/* Clear button */}
          {searchState.query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Filter button */}
        <Button
          variant={showFilters ? "default" : "outline"}
          size="icon"
          className={cn("h-10 w-10", showFilters && "bg-primary")}
          onClick={toggleFilters}
          title="Filter by market"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Market filters */}
      {showFilters && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[100] p-3"
          style={{ backgroundColor: '#1f2937' }}
        >
          <div className="text-xs font-medium text-muted-foreground mb-2">Filter by market</div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'stocks', 'crypto', 'forex'] as const).map((market) => (
              <Button
                key={market}
                variant={marketFilter === market ? "default" : "outline"}
                size="sm"
                onClick={() => handleMarketFilterChange(market)}
                className="text-xs"
              >
                {market === 'all' ? '🌐 All' : 
                 market === 'stocks' ? '📈 Stocks' :
                 market === 'crypto' ? '₿ Crypto' : 
                 '€$ Forex'}
              </Button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2">Try searching for:</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• Stocks: <span className="font-mono">AAPL, TSLA, MSFT</span></div>
              <div>• Crypto: <span className="font-mono">BTC, ETH, SOL, DOGE</span></div>
              <div>• Forex: <span className="font-mono">EUR/USD, GBP/USD</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Search error */}
      {searchState.error && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
          {searchState.error}
        </div>
      )}

      {/* Dropdown */}
      {shouldShowDropdown && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[100] max-h-96 overflow-hidden"
          style={{ backgroundColor: '#1f2937' }}
        >
          {showRecent ? (
            // Recent searches and favorites
            <div className="p-2">
              {favorites.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Star className="h-3 w-3" />
                    Favorites
                  </div>
                  <div className="space-y-1">
                    {favorites.slice(0, 5).map((symbol) => (
                      <div
                        key={`fav-${symbol.symbol}`}
                        className="flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => handleSymbolClick(symbol)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getMarketIcon(symbol.market)}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{symbol.symbol}</span>
                            <span className="text-sm text-muted-foreground truncate">
                              {symbol.name}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {symbol.market}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recentSymbols.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Recent
                  </div>
                  <div className="space-y-1">
                    {recentSymbols.map((symbol) => (
                      <div
                        key={`recent-${symbol.symbol}`}
                        className="flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer"
                        onClick={() => handleSymbolClick(symbol)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getMarketIcon(symbol.market)}</span>
                          <div className="flex flex-col">
                            <span className="font-medium">{symbol.symbol}</span>
                            <span className="text-sm text-muted-foreground truncate">
                              {symbol.name}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {symbol.market}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Search results
            <div className="max-h-80 overflow-y-auto">
              {filteredResults.length > 0 && filteredResults.slice(0, 10).map((result) => (
                <div
                  key={`${result.symbol}-${result.market}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                  onClick={() => handleSymbolClick(result)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getMarketIcon(result.market)}</span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.symbol}</span>
                        {isInWatchlist(result.symbol) && (
                          <Star className="h-3 w-3 fill-current text-warning" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground truncate">
                        {result.name}
                      </span>
                      {result.sector && (
                        <span className="text-xs text-muted-foreground">
                          {result.sector}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        result.market === 'crypto' && "border-warning/50 text-warning",
                        result.market === 'stocks' && "border-success/50 text-success",
                        result.market === 'forex' && "border-info/50 text-info"
                      )}
                    >
                      {result.market}
                    </Badge>
                    
                    {!isInWatchlist(result.symbol) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleAddToWatchlist(e, result)}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {searchState.query && filteredResults.length === 0 && !searchState.isLoading && (
                <div className="p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2">
                    No results found for &quot;{searchState.query}&quot;
                    {marketFilter !== 'all' && ` in ${marketFilter}`}
                  </div>
                  {marketFilter !== 'all' && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleMarketFilterChange('all')}
                      className="text-xs"
                    >
                      Search all markets
                    </Button>
                  )}
                </div>
              )}

              {/* Results count */}
              {!showRecent && searchState.query && filteredResults.length > 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                  Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                  {marketFilter !== 'all' && ` in ${marketFilter}`}
                  {marketFilter !== 'all' && searchState.results.length > filteredResults.length && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleMarketFilterChange('all')}
                      className="text-xs ml-2 h-auto p-0"
                    >
                      (Show all {searchState.results.length})
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Quick actions footer */}
          <div className="border-t border-gray-700 p-2 bg-gray-900">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Use ↑↓ to navigate, Enter to select</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Live data</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}