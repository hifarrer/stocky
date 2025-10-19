# Stocky - Real-Time Financial Dashboard

A modern, real-time financial market dashboard built with Next.js, TypeScript, and Tailwind CSS. Track stocks, cryptocurrencies, market sentiment, and more in a beautiful, customizable interface.

## Features

- 🔍 **Universal Search** - Search stocks, cryptocurrencies, and forex pairs in one place
  - Filter by market type (stocks, crypto, forex)
  - CoinGecko integration for comprehensive crypto coverage
  - Recent searches and favorites
- 📊 **Real-time Price Charts** - Live stock and crypto price tracking
- 🔥 **Market Heatmaps** - Visual representation of market performance
  - Stocks heatmap (via Polygon.io)
  - Cryptocurrency heatmap (via CoinGecko)
- 📈 **Technical Indicators** - RSI, MACD, Moving Averages, and more
- 📰 **News Feed** - Latest market news and analysis
- 💹 **Top Movers** - Biggest gainers and losers
- 🎯 **Sector Performance** - Track sector rotations
- 📅 **Economic Calendar** - Key economic events
- 💬 **Social & Market Sentiment** - Gauge market mood
- 🎨 **Customizable Layout** - Drag and drop widgets
- 📱 **Responsive Design** - Works on desktop and mobile

## API Integrations

### Polygon.io (Stocks)
For stock market data, this dashboard uses [Polygon.io](https://polygon.io/).

**Setup:**
1. Sign up at [polygon.io](https://polygon.io/)
2. Get your free API key
3. Add to `.env.local`:
```bash
NEXT_PUBLIC_POLYGON_API_KEY=your_polygon_api_key_here
```

### CoinGecko (Cryptocurrency)
For cryptocurrency data, this dashboard uses [CoinGecko API](https://www.coingecko.com/en/api).

**Setup:**
- **No API key required for free tier!** 
- The crypto heatmap and search work out of the box
- Optional: Get a Demo or Pro API key for higher rate limits
- Add to `.env.local` (optional):
```bash
NEXT_PUBLIC_COINGECKO_API_KEY=your_demo_or_pro_key_here
```

**Features:**
- 🔍 **Crypto Search** - Search over 10,000+ cryptocurrencies by name or symbol
- 🔥 **Market Heatmap** - Visual crypto market overview
- 📊 **Real-time Prices** - Live crypto price tracking

**Note:** CoinGecko requests go through Next.js API routes to avoid CORS issues. The API key is stored server-side and never exposed to the browser.

**Free Tier Limits:**
- 10-50 calls/minute
- Perfect for personal dashboards
- No credit card required

## Getting Started

1. **Clone the repository**
```bash
git clone <repository-url>
cd stocky
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```bash
# Required for stocks
NEXT_PUBLIC_POLYGON_API_KEY=your_polygon_api_key_here

# Optional for crypto (works without it)
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_api_key_here
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Charts:** Lightweight Charts (TradingView)
- **Grid Layout:** react-grid-layout
- **Icons:** Lucide React
- **Testing:** Jest + React Testing Library

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API routes
│   └── page.tsx        # Main dashboard page
├── components/
│   ├── layout/         # Layout components
│   ├── search/         # Search functionality
│   ├── ui/             # UI components (shadcn)
│   └── widgets/        # Dashboard widgets
├── contexts/           # React contexts
├── lib/
│   ├── coingecko/     # CoinGecko API client
│   ├── polygon/       # Polygon.io API client
│   └── utils.ts       # Utility functions
├── styles/            # Global styles
└── types/             # TypeScript types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Using the Search Feature

The universal search bar allows you to search for stocks, cryptocurrencies, and forex pairs:

### Searching for Crypto
1. Click the search bar at the top of the dashboard
2. Type a crypto name or symbol (e.g., "Bitcoin", "BTC", "Ethereum", "ETH")
3. Use the filter button (🔍) to filter by market type
4. Select "₿ Crypto" to show only cryptocurrency results
5. Click on any result to view its data

### Search Examples
- **Stocks:** `AAPL`, `TSLA`, `MSFT`, `GOOGL`
- **Crypto:** `BTC`, `ETH`, `SOL`, `DOGE`, `SHIB`
- **Forex:** `EUR/USD`, `GBP/USD`, `JPY/USD`

### Search Features
- **Market Filters** - Filter by stocks, crypto, or forex
- **Recent Searches** - Quick access to your search history
- **Favorites** - Star symbols to add them to favorites
- **Real-time Results** - Get instant results as you type

## Customization

### Adding Widgets
1. Create a new component in `src/components/widgets/`
2. Export it from `src/components/widgets/index.tsx`
3. Add it to the dashboard grid in `src/app/page.tsx`
4. Update the layout in `src/components/layout/DashboardGrid.tsx`

### Layout
The dashboard uses a drag-and-drop grid layout. You can:
- Drag widgets to reorder them
- Resize widgets by dragging corners
- Reset layout with the "Reset Layout" button

## Troubleshooting

### API Errors
If you see "API Error" badges on widgets:
1. Check that your API keys are set correctly in `.env.local`
2. Verify your API keys are valid
3. Check API rate limits (free tiers have limits)
4. Mock data will be displayed when APIs fail

### Crypto Data Not Loading
- CoinGecko works without an API key
- If you have rate limit issues, wait a minute and refresh
- Check browser console for detailed error messages

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Polygon.io API Docs](https://polygon.io/docs)
- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
