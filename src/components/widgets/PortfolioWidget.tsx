'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSymbol } from '@/contexts/SymbolContext';
import { PortfolioChart } from './PortfolioChart';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  color?: string;
  items: PortfolioItem[];
}

interface PortfolioItem {
  id: string;
  symbol: string;
  market_type: 'stocks' | 'crypto' | 'forex';
  quantity: number;
  average_price?: number;
  notes?: string;
  current_price?: number;
  change_percent?: number;
  chart_data?: number[];
}

interface PortfolioWidgetProps {
  className?: string;
}

export function CryptoPortfolioWidget({ className }: PortfolioWidgetProps) {
  const { user, token } = useAuth();
  const { selectSymbol, searchSymbols, searchState } = useSymbol();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedDefaultCreation, setHasAttemptedDefaultCreation] = useState(false);

  const loadPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        // Filter for crypto portfolios only
        const cryptoPortfolios = data.data.filter((p: Portfolio) => 
          p.name.toLowerCase().includes('crypto') || p.is_default
        );
        setPortfolios(cryptoPortfolios);
        setError(null); // Clear any previous errors
        // Set default crypto portfolio as selected
        const defaultPortfolio = cryptoPortfolios.find((p: Portfolio) => p.is_default);
        if (defaultPortfolio) {
          setSelectedPortfolio(defaultPortfolio);
        } else if (cryptoPortfolios.length > 0) {
          setSelectedPortfolio(cryptoPortfolios[0]);
        }
      } else {
        setError(data.error || 'Failed to load portfolios');
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      setError('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createDefaultPortfolio = useCallback(async () => {
    if (!token || !user) {
      console.log('CryptoPortfolioWidget: No token or user, skipping default portfolio creation');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/portfolio/create-crypto-default', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create default crypto portfolio:', errorData.error || 'Unknown error');
        setError(errorData.error || 'Failed to create default crypto portfolio');
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Default crypto portfolio ready:', data.message || 'Created successfully');
        await loadPortfolios();
      } else {
        console.error('Failed to create default crypto portfolio:', data.error);
        setError(data.error || 'Failed to create default crypto portfolio');
      }
    } catch (error) {
      console.error('Error creating default crypto portfolio:', error);
      setError('Failed to create default crypto portfolio');
    } finally {
      setLoading(false);
    }
  }, [token, user, loadPortfolios]);

  // Load portfolios on mount
  useEffect(() => {
    if (user && token) {
      loadPortfolios();
    }
  }, [user, token, loadPortfolios]);

  // Create default portfolio if user has none
  useEffect(() => {
    if (user && token && portfolios.length === 0 && !loading && !error && !hasAttemptedDefaultCreation) {
      console.log('Creating default portfolio for new user...');
      setHasAttemptedDefaultCreation(true);
      createDefaultPortfolio();
    }
  }, [user, token, portfolios.length, loading, error, hasAttemptedDefaultCreation, createDefaultPortfolio]);

  const handleAddSymbol = async () => {
    if (!newSymbol.trim() || !selectedPortfolio) return;

    try {
      setLoading(true);
      setError(null);

      // Search for the symbol to get market type
      await searchSymbols(newSymbol);
      
      if (searchState.results.length === 0) {
        setError('Symbol not found');
        return;
      }

      // Filter for crypto only
      const cryptoResults = searchState.results.filter(result => result.market === 'crypto');
      
      if (cryptoResults.length === 0) {
        setError('Crypto symbol not found. Please search for a valid cryptocurrency symbol.');
        return;
      }

      const symbolData = cryptoResults[0];
      const marketType = symbolData.market;

      const response = await fetch(`/api/portfolio/${selectedPortfolio.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase(),
          market_type: marketType,
          quantity: parseFloat(newQuantity) || 0,
          average_price: parseFloat(newPrice) || null,
          notes: newNotes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload portfolios to get updated data
        await loadPortfolios();
        setShowAddForm(false);
        setNewSymbol('');
        setNewQuantity('');
        setNewPrice('');
        setNewNotes('');
      } else {
        setError(data.error || 'Failed to add symbol');
      }
    } catch (error) {
      console.error('Error adding symbol:', error);
      setError('Failed to add symbol');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSymbol = async (itemId: string) => {
    if (!selectedPortfolio) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/portfolio/${selectedPortfolio.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPortfolios();
      } else {
        setError(data.error || 'Failed to remove symbol');
      }
    } catch (error) {
      console.error('Error removing symbol:', error);
      setError('Failed to remove symbol');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolClick = (symbol: string) => {
    // Find the symbol in search results or create a basic symbol object
    const symbolData = searchState.results.find(s => s.symbol === symbol) || {
      symbol,
      name: symbol,
      market: 'stocks' as const,
    };
    
    selectSymbol(symbolData);
  };

  const formatPrice = (price?: number | string) => {
    if (!price) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';
    return `$${numPrice.toFixed(2)}`;
  };

  const formatChange = (change?: number | string) => {
    if (!change) return null;
    const numChange = typeof change === 'string' ? parseFloat(change) : change;
    if (isNaN(numChange)) return null;
    const isPositive = numChange >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(numChange).toFixed(2)}%
      </span>
    );
  };

  if (!user) {
    return (
      <Card className={`${className} h-full flex flex-col`}>
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Crypto Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center py-8">
            Please log in to view your portfolio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} h-full flex flex-col`}>
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Crypto Portfolio
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Crypto
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Add New Crypto</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Crypto Symbol (e.g., BTC, ETH)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              />
              <Input
                placeholder="Quantity"
                type="number"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Average Price (optional)"
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
              <Input
                placeholder="Notes (optional)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddSymbol}
              disabled={loading || !newSymbol.trim()}
              className="w-full"
            >
              {loading ? 'Adding...' : 'Add to Crypto Portfolio'}
            </Button>
          </div>
        )}

        {selectedPortfolio && selectedPortfolio.items.length > 0 ? (
          <div className="space-y-2">
            {selectedPortfolio.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleSymbolClick(item.symbol)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{item.symbol}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.market_type}
                    </Badge>
                    {item.quantity > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {item.quantity} shares
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span>Price: {formatPrice(item.current_price)}</span>
                    {item.average_price && (
                      <span>Avg: {formatPrice(item.average_price)}</span>
                    )}
                    {formatChange(item.change_percent)}
                  </div>
                  <div className="h-12">
                    <PortfolioChart
                      symbol={item.symbol}
                      marketType={item.market_type}
                      className="w-full"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSymbol(item.id);
                  }}
                  className="text-red-600 hover:text-red-700 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {selectedPortfolio ? 'No crypto in portfolio' : 'No portfolio selected'}
            </p>
            {!selectedPortfolio && (
              <p className="text-sm text-muted-foreground mt-2">
                Create a portfolio to start tracking your crypto investments
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
