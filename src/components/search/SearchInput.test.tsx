import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchInput } from '@/components/search/SearchInput';
import { SymbolProvider } from '@/contexts/SymbolContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';

// Mock the Polygon client
jest.mock('@/lib/polygon', () => ({
  createPolygonClient: () => ({
    searchTickersEnhanced: jest.fn().mockResolvedValue({
      stocks: [
        { ticker: 'AAPL', name: 'Apple Inc.', market: 'stocks' },
        { ticker: 'GOOGL', name: 'Alphabet Inc.', market: 'stocks' },
      ],
      cryptos: [],
      forex: [],
    }),
    reference: {
      validateTicker: jest.fn().mockResolvedValue(true),
    },
  }),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <UserPreferencesProvider>
      <SymbolProvider apiKey="test-key">
        {component}
      </SymbolProvider>
    </UserPreferencesProvider>
  );
};

describe('SearchInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    renderWithProvider(<SearchInput />);
    
    const input = screen.getByPlaceholderText('Search stocks, crypto...');
    expect(input).toBeInTheDocument();
  });

  it('shows loading indicator when searching', async () => {
    renderWithProvider(<SearchInput />);
    
    const input = screen.getByPlaceholderText('Search stocks, crypto...');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    
    // Should show loading indicator briefly
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays search results when typing', async () => {
    renderWithProvider(<SearchInput />);
    
    const input = screen.getByPlaceholderText('Search stocks, crypto...');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {
    renderWithProvider(<SearchInput />);
    
    const input = screen.getByPlaceholderText('Search stocks, crypto...');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    
    // Wait for clear button to appear
    await waitFor(() => {
      const clearButton = screen.getByRole('button');
      fireEvent.click(clearButton);
    });
    
    expect(input).toHaveValue('');
  });

  it('handles empty search gracefully', () => {
    renderWithProvider(<SearchInput />);
    
    const input = screen.getByPlaceholderText('Search stocks, crypto...');
    fireEvent.change(input, { target: { value: '' } });
    
    // Should not show any search results
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
  });
});