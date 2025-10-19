import { createPolygonClient } from '@/lib/polygon';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Polygon API Client', () => {
  let client: ReturnType<typeof createPolygonClient>;

  beforeEach(() => {
    client = createPolygonClient('test-api-key');
    jest.clearAllMocks();
  });

  describe('Reference Client', () => {
    it('should search tickers successfully', async () => {
      const mockResponse = {
        status: 'OK',
        results: [
          {
            ticker: 'AAPL',
            name: 'Apple Inc.',
            market: 'stocks',
            locale: 'us',
            primary_exchange: 'XNAS',
            type: 'CS',
            active: true,
            currency_name: 'usd',
            last_updated_utc: '2023-01-01T00:00:00Z',
          },
        ],
        request_id: 'test-request-id',
        count: 1,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.reference.searchTickers({
        search: 'AAPL',
        limit: 1,
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v3/reference/tickers'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      });

      await expect(
        client.reference.searchTickers({ search: 'AAPL' })
      ).rejects.toThrow();
    });

    it('should validate ticker symbols', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'OK',
          results: [{ ticker: 'AAPL' }],
          count: 1,
        }),
      });

      const isValid = await client.reference.validateTicker('AAPL');
      expect(isValid).toBe(true);
    });
  });

  describe('Snapshot Client', () => {
    it('should fetch ticker snapshot', async () => {
      const mockSnapshot = {
        status: 'OK',
        results: {
          ticker: 'AAPL',
          value: 150.00,
          todaysChange: 2.50,
          todaysChangePerc: 1.69,
          updated: Date.now(),
          market_status: 'open',
          name: 'Apple Inc.',
        },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSnapshot),
      });

      const result = await client.snapshot.getTicker('AAPL');
      expect(result).toEqual(mockSnapshot);
    });
  });

  describe('Historical Client', () => {
    it('should fetch chart data', async () => {
      const mockHistoricalData = {
        status: 'OK',
        ticker: 'AAPL',
        queryCount: 1,
        resultsCount: 1,
        adjusted: true,
        results: [
          {
            c: 150.00, // close
            h: 152.00, // high
            l: 148.00, // low
            o: 149.00, // open
            t: Date.now(), // timestamp
            v: 1000000, // volume
            vw: 150.50, // volume weighted average
          },
        ],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHistoricalData),
      });

      const result = await client.historical.getChartData('AAPL', '1d', 30);
      expect(result).toEqual(mockHistoricalData);
    });
  });

  describe('Error Handling', () => {
    it('should retry on network failures', async () => {
      // First call fails, second succeeds
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'OK', results: [] }),
        });

      const result = await client.reference.searchTickers({ search: 'AAPL' });
      expect(result.status).toBe('OK');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle rate limiting with exponential backoff', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '1']]),
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      });

      await expect(
        client.reference.searchTickers({ search: 'AAPL' })
      ).rejects.toThrow();

      // Should have made multiple attempts
      expect(fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });
});