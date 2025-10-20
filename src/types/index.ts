// Market and Symbol Types
export type MarketType = 'stocks' | 'crypto' | 'forex';

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface TickerSymbol {
  symbol: string;
  market: MarketType;
  name?: string;
  sector?: string;
  marketCap?: number;
  coinId?: string; // CoinGecko ID for crypto symbols
  marketCapRank?: number; // Market cap rank for crypto
}

// API Response Types
export interface PolygonTickerSearch {
  results: Array<{
    ticker: string;
    name: string;
    market: string;
    locale: string;
    primary_exchange: string;
    type: string;
    active: boolean;
    currency_name: string;
    cik?: string;
    composite_figi?: string;
    share_class_figi?: string;
    last_updated_utc: string;
  }>;
  status: string;
  request_id: string;
  count: number;
  next_url?: string;
}

export interface SnapshotData {
  ticker: string;
  todaysChangePerc: number;
  todaysChange: number;
  updated: number;
  timeframe: string;
  value: number;
  day?: {
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
    vw: number;
  };
  min?: {
    av: number;
    c: number;
    h: number;
    l: number;
    o: number;
    t: number;
    v: number;
    vw: number;
  };
  prevDay?: {
    c: number;
    h: number;
    l: number;
    o: number;
    v: number;
    vw: number;
  };
  fmv?: number;
  last_quote?: {
    P: number;
    S: number;
    p: number;
    s: number;
    t: number;
  };
  last_trade?: {
    c: number[];
    i: string;
    p: number;
    s: number;
    t: number;
    x: number;
  };
  market_status: 'open' | 'closed' | 'extended_hours';
  name: string;
  error?: string;
  session?: {
    change: number;
    change_percent: number;
    early_trading_change: number;
    early_trading_change_percent: number;
    close: number;
    high: number;
    low: number;
    open: number;
    previous_close: number;
  };
}

export interface AggregateData {
  c: number; // close
  h: number; // high
  l: number; // low
  o: number; // open
  t: number; // timestamp
  v: number; // volume
  vw: number; // volume weighted average price
  n?: number; // number of transactions
}

export interface HistoricalData {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: AggregateData[];
  status: string;
  request_id: string;
  next_url?: string;
}

export interface NewsArticle {
  id: string;
  publisher: {
    name: string;
    homepage_url: string;
    logo_url: string;
    favicon_url: string;
  };
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  tickers: string[];
  image_url?: string;
  description: string;
  keywords: string[];
  insights?: Array<{
    ticker: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    sentiment_reasoning: string;
  }>;
}

export interface MarketStatus {
  market: string;
  serverTime: string;
  exchanges: {
    nasdaq: string;
    nyse: string;
    otc: string;
  };
  currencies: {
    fx: string;
    crypto: string;
  };
  afterHours: boolean;
  earlyHours: boolean;
}

// WebSocket Types
export interface WebSocketMessage {
  ev: string; // event type
  sym?: string; // symbol (optional for status messages)
  c?: number; // close/current price
  h?: number; // high
  l?: number; // low
  o?: number; // open
  v?: number; // volume
  av?: number; // accumulated volume
  op?: number; // official open price
  vw?: number; // volume weighted average
  t?: number; // timestamp
  s?: number; // start timestamp
  e?: number; // end timestamp
}

export interface WebSocketSubscription {
  action: 'subscribe' | 'unsubscribe';
  params: string;
}

export interface WebSocketAuthMessage {
  action: 'auth';
  params: string;
}

// Database Types
export interface UserPreferences {
  userId: string;
  defaultSymbol: string;
  chartTimeframe: TimeFrame;
  themePreferences: {
    darkMode: boolean;
    primaryColor: string;
    accentColor: string;
  };
  watchlist: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketDataCache {
  symbol: string;
  marketType: MarketType;
  snapshotData: SnapshotData;
  lastUpdated: Date;
  dailySummary: {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
  };
}

export interface NewsCache {
  articleId: string;
  symbol: string;
  headline: string;
  summary: string;
  publishedAt: Date;
  source: string;
  articleUrl: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Component State Types
export interface SearchState {
  query: string;
  results: TickerSymbol[];
  isLoading: boolean;
  selectedSymbol?: TickerSymbol;
  recentSearches: TickerSymbol[];
  error?: string;
}

export interface ChartState {
  timeframe: TimeFrame;
  data: AggregateData[];
  isLoading: boolean;
  error?: string;
  symbol: string;
}

export interface WebSocketState {
  isConnected: boolean;
  subscribedSymbols: Set<string>;
  lastMessage?: import('./polygon').WebSocketMessage;
  connectionRetries: number;
  error?: string;
}

// Widget Props Types
export interface WidgetProps {
  className?: string;
  symbol?: string;
  isLoading?: boolean;
}

export interface ChartWidgetProps extends WidgetProps {
  timeframe: TimeFrame;
  height?: number;
  showVolume?: boolean;
  indicators?: string[];
}

export interface SnapshotWidgetProps extends WidgetProps {
  data?: SnapshotData;
  showExtendedData?: boolean;
}

export interface HeatmapWidgetProps extends WidgetProps {
  marketType: MarketType;
  sectorFilter?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface NewsWidgetProps extends WidgetProps {
  maxArticles?: number;
  showImages?: boolean;
}

// Error Types
export interface APIError {
  message: string;
  code: number;
  type: 'RATE_LIMIT' | 'INVALID_SYMBOL' | 'NETWORK_ERROR' | 'UNAUTHORIZED' | 'UNKNOWN';
  details?: Record<string, unknown>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextUrl?: string;
  count: number;
  totalCount?: number;
}

// Configuration Types
export interface PolygonConfig {
  apiKey: string;
  baseUrl: string;
  wsUrl: string;
  rateLimits: {
    requests: number;
    windowMs: number;
  };
}

export interface AppConfig {
  polygon: PolygonConfig;
  database: {
    connectionString: string;
    poolSize: number;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  features: {
    realTimeData: boolean;
    newsIntegration: boolean;
    userAccounts: boolean;
  };
}