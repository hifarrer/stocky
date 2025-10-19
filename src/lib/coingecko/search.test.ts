import { createCoinGeckoClient } from './index';

describe('CoinGecko Search', () => {
  const client = createCoinGeckoClient();

  // Skip actual API calls in tests to avoid rate limits
  // These tests demonstrate the expected structure
  
  it('should have a search method', () => {
    expect(typeof client.search).toBe('function');
  });

  it('should return expected structure from search', async () => {
    // Mock the API response
    const mockResponse = {
      coins: [
        {
          id: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'BTC',
          market_cap_rank: 1,
          thumb: 'https://example.com/thumb.png',
          large: 'https://example.com/large.png',
        },
      ],
      exchanges: [],
      categories: [],
    };

    // Mock the makeRequest method
    const makeRequestSpy = jest.spyOn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      'makeRequest'
    );
    makeRequestSpy.mockResolvedValueOnce(mockResponse);

    const results = await client.search('bitcoin');

    expect(results).toHaveProperty('coins');
    expect(results).toHaveProperty('exchanges');
    expect(results).toHaveProperty('categories');
    expect(Array.isArray(results.coins)).toBe(true);
  });

  it('should handle search errors gracefully', async () => {
    // Mock an error response
    const makeRequestSpy = jest.spyOn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client as any,
      'makeRequest'
    );
    makeRequestSpy.mockRejectedValueOnce(new Error('Rate limit exceeded'));

    await expect(client.search('invalid')).rejects.toThrow();
  });
});

