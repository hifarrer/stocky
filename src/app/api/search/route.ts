import { NextRequest, NextResponse } from 'next/server';
import { createPolygonClient } from '@/lib/polygon';
import { createCoinGeckoClient } from '@/lib/coingecko';

const polygonClient = createPolygonClient(
  process.env.POLYGON_API_KEY || process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo'
);

const coinGeckoClient = createCoinGeckoClient(
  process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY,
  process.env.COINGECKO_USE_PRO === 'true'
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20');
  const market = searchParams.get('market') as 'stocks' | 'crypto' | 'forex' | null;

  console.log('Search API called with:', { query, limit, market });

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    let results;

    if (market) {
      // Search specific market
      if (market === 'crypto') {
        // Use CoinGecko for crypto search
        try {
          const cgResults = await coinGeckoClient.search(query);
          const cryptoResults = cgResults.coins.slice(0, limit).map(coin => ({
            ticker: coin.symbol.toUpperCase(),
            name: coin.name,
            market: 'crypto',
            locale: 'global',
            primary_exchange: 'crypto',
            type: 'cryptocurrency',
            active: true,
            currency_name: coin.name,
            last_updated_utc: new Date().toISOString(),
            market_cap_rank: coin.market_cap_rank,
            coin_id: coin.id,
          }));
          
          // Sort crypto results to prioritize exact matches
          const upperQuery = query.toUpperCase();
          const sortedCryptoResults = cryptoResults.sort((a, b) => {
            const aExact = a.ticker === upperQuery;
            const bExact = b.ticker === upperQuery;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return 0;
          });
          
          results = { crypto: sortedCryptoResults };
        } catch (cgError) {
          console.warn('CoinGecko search failed, falling back to Polygon:', cgError);
          // Fallback to Polygon if CoinGecko fails
          const response = await polygonClient.reference.searchTickers({
            search: query,
            market,
            active: true,
            limit,
          });
          
          // Sort fallback results to prioritize exact matches
          const upperQuery = query.toUpperCase();
          const sortedResults = (response.results || []).sort((a, b) => {
            const aExact = a.ticker === upperQuery;
            const bExact = b.ticker === upperQuery;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return 0;
          });
          
          results = { [market]: sortedResults };
        }
      } else {
        // Use Polygon for stocks and forex
        const response = await polygonClient.reference.searchTickers({
          search: query,
          market: market === 'forex' ? 'fx' : market,
          active: true,
          limit,
        });
        
        // Sort results to prioritize exact matches
        const upperQuery = query.toUpperCase();
        const sortedResults = (response.results || []).sort((a, b) => {
          const aExact = a.ticker === upperQuery;
          const bExact = b.ticker === upperQuery;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return 0;
        });
        
        results = { [market]: sortedResults };
      }
    } else {
      // Search all markets - combine Polygon stocks/forex with CoinGecko crypto
      const [polygonResults, coinGeckoResults] = await Promise.allSettled([
        polygonClient.searchTickersEnhanced(query, limit),
        coinGeckoClient.search(query),
      ]);

      // Start with Polygon results (stocks and forex)
      const stocks = polygonResults.status === 'fulfilled' ? polygonResults.value.stocks || [] : [];
      const forex = polygonResults.status === 'fulfilled' ? polygonResults.value.forex || [] : [];
      
      // Add CoinGecko crypto results
      let cryptos = [];
      if (coinGeckoResults.status === 'fulfilled') {
        cryptos = coinGeckoResults.value.coins.slice(0, limit).map(coin => ({
          ticker: coin.symbol.toUpperCase(),
          name: coin.name,
          market: 'crypto',
          locale: 'global',
          primary_exchange: 'crypto',
          type: 'cryptocurrency',
          active: true,
          currency_name: coin.name,
          last_updated_utc: new Date().toISOString(),
          market_cap_rank: coin.market_cap_rank,
          coin_id: coin.id,
        }));
      } else {
        // Fallback to Polygon crypto if CoinGecko fails
        console.warn('CoinGecko failed, using Polygon for crypto:', coinGeckoResults.status === 'rejected' ? coinGeckoResults.reason : 'Unknown error');
        cryptos = polygonResults.status === 'fulfilled' ? polygonResults.value.cryptos || [] : [];
      }

      // Prioritize exact matches for all markets
      const upperQuery = query.toUpperCase();
      
      // Sort stocks to prioritize exact matches
      const sortedStocks = stocks.sort((a, b) => {
        const aExact = a.ticker === upperQuery;
        const bExact = b.ticker === upperQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      // Sort crypto to prioritize exact matches
      const sortedCryptos = cryptos.sort((a, b) => {
        const aExact = a.ticker === upperQuery;
        const bExact = b.ticker === upperQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      // Sort forex to prioritize exact matches
      const sortedForex = forex.sort((a, b) => {
        const aExact = a.ticker === upperQuery;
        const bExact = b.ticker === upperQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      results = { stocks: sortedStocks, cryptos: sortedCryptos, forex: sortedForex };
    }

    return NextResponse.json({
      success: true,
      data: results,
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        query,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}