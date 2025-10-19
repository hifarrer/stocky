# CoinGecko API Integration

This module provides a TypeScript client for the CoinGecko cryptocurrency API.

## Features

- ✅ **No API key required** for free tier
- ✅ **Search** - Find cryptocurrencies by name or symbol
- ✅ Market data for 15,000+ cryptocurrencies
- ✅ Real-time prices, market cap, volume, and 24h changes
- ✅ Top gainers and losers
- ✅ Trending coins
- ✅ Global market data

## Free Tier (No API Key Required!)

- ✅ **10-50 calls/minute** (depending on endpoint)
- ✅ **No API key needed** for basic endpoints
- ✅ **No credit card required**
- ✅ Perfect for personal dashboards

The free tier works out of the box without any configuration!

## Pro Tier (Optional)

If you need higher rate limits, you can upgrade to CoinGecko Pro and get an API key for:
- Higher rate limits (up to 500 calls/minute)
- Priority support
- Additional endpoints

## Usage

### Free Tier (Default)

Just use the client without an API key:

```typescript
import { createCoinGeckoClient } from '@/lib/coingecko';

// No API key needed!
const client = createCoinGeckoClient();

// Search for cryptocurrencies
const searchResults = await client.search('bitcoin');
// Returns: { coins: [...], exchanges: [...], categories: [...] }

// Get top cryptocurrencies by market cap
const markets = await client.markets.getMarkets({
  vs_currency: 'usd',
  order: 'market_cap_desc',
  per_page: 20,
});

// Get top gainers
const gainers = await client.markets.getTopGainers(10);

// Get top losers
const losers = await client.markets.getTopLosers(10);
```

### With API Key (Demo or Pro Tier - Optional)

CoinGecko offers two types of API keys:

**1. Demo API Key** (Free with sign-up)
- Requires free account registration
- Higher rate limits than anonymous free tier
- Uses header: `x-cg-demo-api-key`
- Base URL: `https://api.coingecko.com/api/v3`

**2. Pro API Key** (Paid plans)
- Premium features and much higher limits  
- Starts with `CG-` prefix
- Uses header: `x-cg-pro-api-key`
- Base URL: `https://pro-api.coingecko.com/api/v3` ⚠️

Add your API key to `.env.local`:

```bash
# Demo API key (any format, doesn't start with CG-)
NEXT_PUBLIC_COINGECKO_API_KEY=your_demo_key_here

# OR Pro API key (starts with CG-)
NEXT_PUBLIC_COINGECKO_API_KEY=CG-YourProKeyHere
```

**Important Notes:**
- The key must be prefixed with `NEXT_PUBLIC_` to work in client components
- Make sure there are no extra spaces or quotes around the key
- Restart your dev server after adding the key
- The client auto-detects whether you have a Demo or Pro key
- **Pro keys automatically use the correct base URL** (`pro-api.coingecko.com`)

The key will be automatically used:

```typescript
const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
const client = createCoinGeckoClient(apiKey);
// Auto-detects demo vs pro based on key format
```

## API Methods

### Search

- `search(query)` - Search for cryptocurrencies, exchanges, and categories by name or symbol

### Markets

- `getMarkets(params)` - Get cryptocurrency market data
- `getTopGainers(limit)` - Get top gaining coins (24h)
- `getTopLosers(limit)` - Get top losing coins (24h)
- `getCoinsByIds(coinIds)` - Get specific coins by IDs
- `getTrending()` - Get trending coins
- `getGlobal()` - Get global cryptocurrency data

## Rate Limiting

The free tier has rate limits. The client automatically handles:
- Error responses for rate limiting
- Proper error messages
- Timeouts (10 seconds default)

## Resources

- [CoinGecko API Documentation](https://www.coingecko.com/en/api/documentation)
- [CoinGecko Pro Pricing](https://www.coingecko.com/en/api/pricing)

## Why CoinGecko?

1. **Free tier is generous** - No API key needed for basic use
2. **Reliable** - 99.9% uptime
3. **Comprehensive** - Covers virtually all cryptocurrencies
4. **Real-time** - Updates frequently
5. **Well-documented** - Excellent API documentation

