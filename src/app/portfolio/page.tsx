'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Edit3,
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  X,
  TrendingUp as StockIcon,
  Save,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSymbol } from '@/contexts/SymbolContext';
import { usePlan } from '@/contexts/PlanContext';
// UpgradePrompt removed for demo mode
import { PortfolioChart } from '@/components/widgets/PortfolioChart';
import { SimpleHeader } from '@/components/layout/SimpleHeader';

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

interface EditingItem {
  id: string;
  quantity: string;
  average_price: string;
  notes: string;
}

interface Alert {
  id: string;
  user_id: string;
  portfolio_item_id: string;
  symbol: string;
  market_type: 'stocks' | 'crypto' | 'forex';
  alert_type: 'price_up' | 'price_down' | 'change_up' | 'change_down';
  target_value: number;
  current_price?: number;
  is_triggered: boolean;
  triggered_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  portfolio_name?: string;
}

export default function PortfolioPage() {
  const { user, token } = useAuth();
  const { selectSymbol, searchState } = useSymbol();
  const { hasPortfolioAccess } = usePlan();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [stockPortfolio, setStockPortfolio] = useState<Portfolio | null>(null);
  const [cryptoPortfolio, setCryptoPortfolio] = useState<Portfolio | null>(null);
  const [showAddStockForm, setShowAddStockForm] = useState(false);
  const [showAddCryptoForm, setShowAddCryptoForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Stock form state
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockQuantity, setNewStockQuantity] = useState('');
  const [newStockPrice, setNewStockPrice] = useState('');
  const [newStockNotes, setNewStockNotes] = useState('');
  
  // Crypto form state
  const [newCryptoSymbol, setNewCryptoSymbol] = useState('');
  const [newCryptoQuantity, setNewCryptoQuantity] = useState('');
  const [newCryptoPrice, setNewCryptoPrice] = useState('');
  const [newCryptoNotes, setNewCryptoNotes] = useState('');
  
  // Alert form state
  const [alertUpPercent, setAlertUpPercent] = useState('');
  const [alertDownPercent, setAlertDownPercent] = useState('');
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [selectedItemForAlert, setSelectedItemForAlert] = useState<PortfolioItem | null>(null);
  
  // Symbol search state
  const [stockSearchResults, setStockSearchResults] = useState<{symbol: string, name: string, price?: number, market: string}[]>([]);
  const [cryptoSearchResults, setCryptoSearchResults] = useState<{symbol: string, name: string, price?: number, market: string}[]>([]);
  const [showStockSearchResults, setShowStockSearchResults] = useState(false);
  const [showCryptoSearchResults, setShowCryptoSearchResults] = useState(false);
  
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
        setPortfolios(data.data);
        setError(null);
        
        // Find stock and crypto portfolios
        const stockPort = data.data.find((p: Portfolio) => 
          p.name.toLowerCase().includes('stock')
        );
        const cryptoPort = data.data.find((p: Portfolio) => 
          p.name.toLowerCase().includes('crypto') || p.is_default
        );
        
        setStockPortfolio(stockPort || null);
        setCryptoPortfolio(cryptoPort || null);
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

  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.data);
      } else {
        console.error('Failed to load alerts:', data.error);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }, [token]);

  const createDefaultPortfolios = useCallback(async () => {
    try {
      setLoading(true);
      
      // Create stock portfolio
      const stockResponse = await fetch('/api/portfolio/create-stock-default', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Create crypto portfolio
      const cryptoResponse = await fetch('/api/portfolio/create-crypto-default', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const stockData = await stockResponse.json();
      const cryptoData = await cryptoResponse.json();
      
      if (stockData.success && cryptoData.success) {
        console.log('Default portfolios created successfully');
        await loadPortfolios();
      } else {
        console.error('Failed to create default portfolios');
        setError('Failed to create default portfolios');
      }
    } catch (error) {
      console.error('Error creating default portfolios:', error);
      setError('Failed to create default portfolios');
    } finally {
      setLoading(false);
    }
  }, [token, loadPortfolios]);

  // Load portfolios and alerts on mount
  useEffect(() => {
    if (user && token) {
      loadPortfolios();
      loadAlerts();
    }
  }, [user, token, loadPortfolios, loadAlerts]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-results-container')) {
        setShowStockSearchResults(false);
        setShowCryptoSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Create default portfolios if user has none
  useEffect(() => {
    if (user && token && portfolios.length === 0 && !loading && !error && !hasAttemptedDefaultCreation) {
      console.log('Creating default portfolios for new user...');
      setHasAttemptedDefaultCreation(true);
      createDefaultPortfolios();
    }
  }, [user, token, portfolios.length, loading, error, hasAttemptedDefaultCreation, createDefaultPortfolios]);

  const handleAddStock = async () => {
    if (!newStockSymbol.trim() || !stockPortfolio) return;

    try {
      setLoading(true);
      setError(null);

      const marketType = 'stocks'; // Always stocks for this function

      // Use the price from the form first (if user selected from dropdown and price was fetched)
      let averagePrice = parseFloat(newStockPrice) || null;
      console.log('Stock form price:', newStockPrice, 'Parsed:', averagePrice);
      
      // If still no price, try to get it from the stock search results that were already loaded
      if (!averagePrice) {
        const existingResults = stockSearchResults.find(result => 
          result.symbol.toUpperCase() === newStockSymbol.toUpperCase()
        );
        if (existingResults && existingResults.price) {
          averagePrice = existingResults.price;
          console.log('Using price from existing stock search results:', existingResults.price);
        }
      }
      
      // If still no price, fetch it directly from the stock price API
      if (!averagePrice) {
        console.log('No price found, fetching from stock price API for:', newStockSymbol);
        try {
          const priceResponse = await fetch(`/api/stock/price/${newStockSymbol}`);
          const priceData = await priceResponse.json();
          console.log('Fetched stock price data:', priceData);
          
          if (priceData.success && priceData.data?.current_price) {
            averagePrice = priceData.data.current_price;
            console.log('Using fetched current stock price:', averagePrice);
          }
        } catch (priceError) {
          console.error('Failed to fetch current stock price:', priceError);
        }
      }
      
      console.log('Final average price for stock:', averagePrice);

      const response = await fetch(`/api/portfolio/${stockPortfolio.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: newStockSymbol.toUpperCase(),
          market_type: marketType,
          quantity: parseFloat(newStockQuantity) || 0,
          average_price: averagePrice,
          notes: newStockNotes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPortfolios();
        setShowAddStockForm(false);
        setNewStockSymbol('');
        setNewStockQuantity('');
        setNewStockPrice('');
        setNewStockNotes('');
      } else {
        setError(data.error || 'Failed to add stock');
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      setError('Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrypto = async () => {
    if (!newCryptoSymbol.trim() || !cryptoPortfolio) return;

    try {
      setLoading(true);
      setError(null);

      const marketType = 'crypto'; // Always crypto for this function

      // Use the price from the form first (if user selected from dropdown and price was fetched)
      let averagePrice = parseFloat(newCryptoPrice) || null;
      console.log('Crypto form price:', newCryptoPrice, 'Parsed:', averagePrice);
      
      // If still no price, try to get it from the crypto search results that were already loaded
      if (!averagePrice) {
        const existingResults = cryptoSearchResults.find(result => 
          result.symbol.toUpperCase() === newCryptoSymbol.toUpperCase()
        );
        if (existingResults && existingResults.price) {
          averagePrice = existingResults.price;
          console.log('Using price from existing crypto search results:', existingResults.price);
        }
      }
      
      // If still no price, fetch it directly from the crypto price API
      if (!averagePrice) {
        console.log('No price found, fetching from crypto price API for:', newCryptoSymbol);
        try {
          const priceResponse = await fetch(`/api/crypto/price/${newCryptoSymbol.toLowerCase()}`);
          const priceData = await priceResponse.json();
          console.log('Fetched crypto price data:', priceData);
          
          if (priceData.success && priceData.data?.current_price) {
            averagePrice = priceData.data.current_price;
            console.log('Using fetched current crypto price:', averagePrice);
          }
        } catch (priceError) {
          console.error('Failed to fetch current crypto price:', priceError);
        }
      }
      
      console.log('Final average price for crypto:', averagePrice);

      const response = await fetch(`/api/portfolio/${cryptoPortfolio.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol: newCryptoSymbol.toUpperCase(),
          market_type: marketType,
          quantity: parseFloat(newCryptoQuantity) || 0,
          average_price: averagePrice,
          notes: newCryptoNotes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPortfolios();
        setShowAddCryptoForm(false);
        setNewCryptoSymbol('');
        setNewCryptoQuantity('');
        setNewCryptoPrice('');
        setNewCryptoNotes('');
      } else {
        setError(data.error || 'Failed to add crypto');
      }
    } catch (error) {
      console.error('Error adding crypto:', error);
      setError('Failed to add crypto');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: PortfolioItem) => {
    setEditingItem({
      id: item.id,
      quantity: item.quantity.toString(),
      average_price: item.average_price?.toString() || '',
      notes: item.notes || '',
    });
  };

  const handleSaveEdit = async (portfolioId: string) => {
    if (!editingItem) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/portfolio/${portfolioId}/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: parseFloat(editingItem.quantity) || 0,
          average_price: parseFloat(editingItem.average_price) || null,
          notes: editingItem.notes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPortfolios();
        setEditingItem(null);
      } else {
        setError(data.error || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setError('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (portfolioId: string, itemId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/portfolio/${portfolioId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPortfolios();
      } else {
        setError(data.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (item: PortfolioItem) => {
    setSelectedItemForAlert(item);
    setShowAlertForm(true);
  };

  const handleSaveAlert = async () => {
    if (!selectedItemForAlert) return;

    try {
      setLoading(true);
      const alertsToCreate = [];

      if (alertUpPercent && parseFloat(alertUpPercent) > 0) {
        alertsToCreate.push({
          portfolio_item_id: selectedItemForAlert.id,
          alert_type: 'change_up',
          target_value: parseFloat(alertUpPercent)
        });
      }

      if (alertDownPercent && parseFloat(alertDownPercent) > 0) {
        alertsToCreate.push({
          portfolio_item_id: selectedItemForAlert.id,
          alert_type: 'change_down',
          target_value: parseFloat(alertDownPercent)
        });
      }

      if (alertsToCreate.length === 0) {
        setError('Please enter at least one alert percentage');
        return;
      }

      for (const alertData of alertsToCreate) {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(alertData),
        });

        const data = await response.json();
        
        if (!data.success) {
          setError(data.error || 'Failed to create alert');
          return;
        }
      }

      await loadAlerts();
      setShowAlertForm(false);
      setSelectedItemForAlert(null);
      setAlertUpPercent('');
      setAlertDownPercent('');
    } catch (error) {
      console.error('Error creating alert:', error);
      setError('Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        await loadAlerts();
      } else {
        setError(data.error || 'Failed to delete alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      setError('Failed to delete alert');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolClick = (symbol: string) => {
    const symbolData = searchState.results.find(s => s.symbol === symbol) || {
      symbol,
      name: symbol,
      market: 'stocks' as const,
    };
    
    selectSymbol(symbolData);
  };

  const handleStockSymbolSearch = async (query: string) => {
    if (!query.trim()) {
      setStockSearchResults([]);
      setShowStockSearchResults(false);
      return;
    }

    try {
      // Call the search API with market=stocks parameter to use Polygon
      const searchUrl = `/api/search?q=${encodeURIComponent(query)}&limit=20&market=stocks`;
      console.log('🔍 Stock search URL:', searchUrl);
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      // When market parameter is used, results are directly in data.data.stocks
      const stockResults = data.data.stocks ? data.data.stocks.map((ticker: {
        ticker: string;
        name: string;
        sic_description?: string;
      }) => ({
        symbol: ticker.ticker,
        name: ticker.name,
        market: 'stocks' as const,
        price: undefined // Stocks don't have price in search results
      })) : [];

      setStockSearchResults(stockResults);
      setShowStockSearchResults(true);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setStockSearchResults([]);
      setShowStockSearchResults(false);
    }
  };

  const handleCryptoSymbolSearch = async (query: string) => {
    if (!query.trim()) {
      setCryptoSearchResults([]);
      setShowCryptoSearchResults(false);
      return;
    }

    try {
      console.log('Searching for crypto:', query);
      // Call the search API with market=crypto parameter to use CoinGecko
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20&market=crypto`);
      const data = await response.json();
      
      console.log('Crypto search response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      // When market parameter is used, results are directly in data.data.crypto
      const cryptoResults = data.data.crypto ? data.data.crypto.map((coin: {
        ticker: string;
        name: string;
        market: string;
        coin_id?: string;
        market_cap_rank?: number;
      }) => ({
        symbol: coin.ticker,
        name: coin.name,
        market: 'crypto' as const,
        price: undefined // Price not available in search results
      })) : [];

      console.log('Crypto search results:', cryptoResults);
      setCryptoSearchResults(cryptoResults);
      setShowCryptoSearchResults(true);
    } catch (error) {
      console.error('Error searching crypto:', error);
      setCryptoSearchResults([]);
      setShowCryptoSearchResults(false);
    }
  };

  const handleSelectStockSymbol = async (symbolData: {symbol: string, name: string, price?: number, market: string}) => {
    console.log('Selected stock symbol:', symbolData);
    setNewStockSymbol(symbolData.symbol);
    
    // If no price in search results, fetch current price
    if (!symbolData.price) {
      console.log('No price in search results, fetching current price for:', symbolData.symbol);
      try {
        const response = await fetch(`/api/stock/price/${symbolData.symbol}`);
        console.log('Stock price API response status:', response.status);
        const priceData = await response.json();
        console.log('Stock price API response data:', priceData);
        
        if (priceData.success && priceData.data?.current_price) {
          console.log('Setting stock price to:', priceData.data.current_price);
          setNewStockPrice(priceData.data.current_price.toString());
        } else {
          console.log('No current price available in response');
        }
      } catch (error) {
        console.error('Error fetching current stock price:', error);
      }
    } else {
      console.log('Using price from search results:', symbolData.price);
      setNewStockPrice(symbolData.price.toString());
    }
    
    setShowStockSearchResults(false);
    setStockSearchResults([]);
  };

  const handleSelectCryptoSymbol = async (symbolData: {symbol: string, name: string, price?: number, market: string}) => {
    console.log('Selected crypto symbol:', symbolData);
    setNewCryptoSymbol(symbolData.symbol);
    
    // Always fetch current price since search results don't include prices
    console.log('Fetching current price for:', symbolData.symbol);
    try {
      const response = await fetch(`/api/crypto/price/${symbolData.symbol.toLowerCase()}`);
      console.log('Price API response status:', response.status);
      const priceData = await response.json();
      console.log('Price API response data:', priceData);
      
      if (priceData.success && priceData.data?.current_price) {
        console.log('Setting crypto price to:', priceData.data.current_price);
        setNewCryptoPrice(priceData.data.current_price.toString());
      } else {
        console.log('No current price available in response');
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
    
    setShowCryptoSearchResults(false);
    setCryptoSearchResults([]);
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
      <div className="min-h-screen bg-background text-foreground">
        <SimpleHeader 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold mb-4">Portfolio Management</h1>
            <p className="text-muted-foreground text-lg">
              Please log in to view and manage your portfolios
            </p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background text-foreground">
      <SimpleHeader 
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portfolio Management</h1>
        <p className="text-muted-foreground">
          Manage your stock and cryptocurrency portfolios
        </p>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <Tabs defaultValue="stocks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stocks" className="flex items-center gap-2">
            <StockIcon className="h-4 w-4" />
            Stock Portfolio
          </TabsTrigger>
          <TabsTrigger value="crypto" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Crypto Portfolio
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stocks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StockIcon className="h-5 w-5" />
                  Stock Portfolio
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddStockForm(!showAddStockForm)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Stock
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddStockForm && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Add New Stock</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddStockForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        placeholder="Search for stock symbol (e.g., AAPL, TSLA)"
                        value={newStockSymbol}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewStockSymbol(value);
                          handleStockSymbolSearch(value);
                        }}
                        onFocus={() => {
                          if (stockSearchResults.length > 0) {
                            setShowStockSearchResults(true);
                          }
                        }}
                      />
                      {showStockSearchResults && stockSearchResults.length > 0 && (
                        <div className="search-results-container absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {stockSearchResults.slice(0, 5).map((result, index) => (
                            <div
                              key={index}
                              className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-600 last:border-b-0"
                              onClick={() => handleSelectStockSymbol(result)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{result.symbol}</div>
                                  <div className="text-sm text-muted-foreground">{result.name}</div>
                                </div>
                                {result.price && (
                                  <div className="text-sm font-medium">
                                    ${result.price.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={newStockQuantity}
                      onChange={(e) => setNewStockQuantity(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Average Price (optional)"
                      type="number"
                      step="0.01"
                      value={newStockPrice}
                      onChange={(e) => setNewStockPrice(e.target.value)}
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={newStockNotes}
                      onChange={(e) => setNewStockNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleAddStock}
                    disabled={loading || !newStockSymbol.trim()}
                    className="w-full"
                  >
                    {loading ? 'Adding...' : 'Add to Stock Portfolio'}
                  </Button>
                </div>
              )}

              {stockPortfolio && stockPortfolio.items.length > 0 ? (
                <div className="space-y-3">
                  {stockPortfolio.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="font-medium cursor-pointer hover:text-blue-600"
                            onClick={() => handleSymbolClick(item.symbol)}
                          >
                            {item.symbol}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {item.market_type}
                          </Badge>
                          {item.quantity > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {item.quantity} shares
                            </span>
                          )}
                        </div>
                        
                        {editingItem?.id === item.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                placeholder="Quantity"
                                type="number"
                                value={editingItem.quantity}
                                onChange={(e) => setEditingItem({
                                  ...editingItem,
                                  quantity: e.target.value
                                })}
                              />
                              <Input
                                placeholder="Average Price"
                                type="number"
                                step="0.01"
                                value={editingItem.average_price}
                                onChange={(e) => setEditingItem({
                                  ...editingItem,
                                  average_price: e.target.value
                                })}
                              />
                              <Input
                                placeholder="Notes"
                                value={editingItem.notes}
                                onChange={(e) => setEditingItem({
                                  ...editingItem,
                                  notes: e.target.value
                                })}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(stockPortfolio.id)}
                                disabled={loading}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(null)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                      
                      {editingItem?.id !== item.id && (
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateAlert(item)}
                            className="text-green-600 hover:text-green-700"
                            title="Set Alert"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(stockPortfolio.id, item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <StockIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {stockPortfolio ? 'No stocks in portfolio' : 'No stock portfolio found'}
                  </p>
                  {!stockPortfolio && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Create a stock portfolio to start tracking your investments
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Crypto Portfolio
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddCryptoForm(!showAddCryptoForm)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Crypto
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAddCryptoForm && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Add New Crypto</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddCryptoForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        placeholder="Search for crypto symbol (e.g., BTC, ETH, ADA)"
                        value={newCryptoSymbol}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNewCryptoSymbol(value);
                          handleCryptoSymbolSearch(value);
                        }}
                        onFocus={() => {
                          if (cryptoSearchResults.length > 0) {
                            setShowCryptoSearchResults(true);
                          }
                        }}
                      />
                      {showCryptoSearchResults && cryptoSearchResults.length > 0 && (
                        <div className="search-results-container absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {cryptoSearchResults.slice(0, 5).map((result, index) => (
                            <div
                              key={index}
                              className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-600 last:border-b-0"
                              onClick={() => handleSelectCryptoSymbol(result)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{result.symbol}</div>
                                  <div className="text-sm text-muted-foreground">{result.name}</div>
                                </div>
                                {result.price && (
                                  <div className="text-sm font-medium">
                                    ${result.price.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder="Quantity"
                      type="number"
                      value={newCryptoQuantity}
                      onChange={(e) => setNewCryptoQuantity(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Average Price (optional)"
                      type="number"
                      step="0.01"
                      value={newCryptoPrice}
                      onChange={(e) => setNewCryptoPrice(e.target.value)}
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={newCryptoNotes}
                      onChange={(e) => setNewCryptoNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleAddCrypto}
                    disabled={loading || !newCryptoSymbol.trim()}
                    className="w-full"
                  >
                    {loading ? 'Adding...' : 'Add to Crypto Portfolio'}
                  </Button>
                </div>
              )}

              {cryptoPortfolio && cryptoPortfolio.items.length > 0 ? (
                <div className="space-y-3">
                  {cryptoPortfolio.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="font-medium cursor-pointer hover:text-blue-600"
                            onClick={() => handleSymbolClick(item.symbol)}
                          >
                            {item.symbol}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {item.market_type}
                          </Badge>
                          {item.quantity > 0 && (
                            <span className="text-sm text-muted-foreground">
                              {item.quantity} shares
                            </span>
                          )}
                        </div>
                        
                        {editingItem?.id === item.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                placeholder="Quantity"
                                type="number"
                                value={editingItem.quantity}
                                onChange={(e) => setEditingItem({
                                  ...editingItem,
                                  quantity: e.target.value
                                })}
                              />
                              <Input
                                placeholder="Average Price"
                                type="number"
                                step="0.01"
                                value={editingItem.average_price}
                                onChange={(e) => setEditingItem({
                                  ...editingItem,
                                  average_price: e.target.value
                                })}
                              />
                              <Input
                                placeholder="Notes"
                                value={editingItem.notes}
                                onChange={(e) => setEditingItem({
                                  ...editingItem,
                                  notes: e.target.value
                                })}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(cryptoPortfolio.id)}
                                disabled={loading}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(null)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                      
                      {editingItem?.id !== item.id && (
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateAlert(item)}
                            className="text-green-600 hover:text-green-700"
                            title="Set Alert"
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(cryptoPortfolio.id, item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {cryptoPortfolio ? 'No crypto in portfolio' : 'No crypto portfolio found'}
                  </p>
                  {!cryptoPortfolio && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Create a crypto portfolio to start tracking your investments
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Price Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{alert.symbol}</span>
                          <Badge variant="secondary" className="text-xs">
                            {alert.market_type}
                          </Badge>
                          {alert.portfolio_name && (
                            <Badge variant="outline" className="text-xs">
                              {alert.portfolio_name}
                            </Badge>
                          )}
                          {alert.is_triggered && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Triggered
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Alert when {alert.alert_type === 'change_up' ? 'price goes up' : 'price goes down'} by {alert.target_value}%
                          {alert.triggered_at && (
                            <span className="ml-2">
                              • Triggered: {new Date(alert.triggered_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No alerts set up yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click the bell icon next to any portfolio item to set up price alerts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Form Modal */}
      {showAlertForm && selectedItemForAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Set Price Alert for {selectedItemForAlert.symbol}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Alert when price goes up by (%)</label>
                <Input
                  type="number"
                  placeholder="e.g., 5"
                  value={alertUpPercent}
                  onChange={(e) => setAlertUpPercent(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Alert when price goes down by (%)</label>
                <Input
                  type="number"
                  placeholder="e.g., 10"
                  value={alertDownPercent}
                  onChange={(e) => setAlertDownPercent(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveAlert}
                  disabled={loading || (!alertUpPercent && !alertDownPercent)}
                  className="flex-1"
                >
                  {loading ? 'Saving...' : 'Save Alerts'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAlertForm(false);
                    setSelectedItemForAlert(null);
                    setAlertUpPercent('');
                    setAlertDownPercent('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
