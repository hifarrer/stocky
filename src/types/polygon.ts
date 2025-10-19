// Polygon.io API specific types

export interface PolygonBaseResponse {
  status: string;
  request_id: string;
  count?: number;
  next_url?: string;
}

// Reference API Types
export interface TickerDetails extends PolygonBaseResponse {
  results: {
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
    market_cap?: number;
    phone_number?: string;
    address?: {
      address1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
    };
    description?: string;
    sic_code?: string;
    sic_description?: string;
    ticker_root?: string;
    homepage_url?: string;
    total_employees?: number;
    list_date?: string;
    branding?: {
      logo_url?: string;
      icon_url?: string;
    };
    share_class_shares_outstanding?: number;
    weighted_shares_outstanding?: number;
    round_lot?: number;
  };
}

export interface TickerNews extends PolygonBaseResponse {
  results: Array<{
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
    amp_url?: string;
    image_url?: string;
    description: string;
    keywords: string[];
    insights?: Array<{
      ticker: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      sentiment_reasoning: string;
    }>;
  }>;
}

// Market Status API Types
export interface MarketHolidays extends PolygonBaseResponse {
  results: Array<{
    exchange: string;
    name: string;
    date: string;
    status: 'closed' | 'early-close';
    open?: string;
    close?: string;
  }>;
}

export interface MarketStatus extends PolygonBaseResponse {
  results: {
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
  };
}

// Snapshot API Types
export interface SnapshotAllTickers extends PolygonBaseResponse {
  results: Array<{
    value: number;
    ticker: string;
    todaysChangePerc: number;
    todaysChange: number;
    updated: number;
    timeframe: string;
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
  }>;
}

export interface SnapshotGainersLosers extends PolygonBaseResponse {
  results: Array<{
    ticker: string;
    value: number;
    change: number;
    change_percent: number;
    session: {
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
    last_quote: {
      P: number;
      S: number;
      p: number;
      s: number;
      t: number;
    };
    last_trade: {
      c: number[];
      i: string;
      p: number;
      s: number;
      t: number;
      x: number;
    };
    market_status: 'open' | 'closed' | 'extended_hours';
    name: string;
  }>;
}

// Historical/Aggregates API Types
export interface AggregatesResponse extends PolygonBaseResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    t: number; // timestamp
    v: number; // volume
    vw: number; // volume weighted average price
    n?: number; // number of transactions
  }>;
}

export interface PreviousCloseResponse extends PolygonBaseResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    T: string; // ticker
    c: number; // close
    h: number; // high
    l: number; // low
    o: number; // open
    t: number; // timestamp
    v: number; // volume
    vw: number; // volume weighted average price
  }>;
}

// Trades API Types
export interface TradesResponse extends PolygonBaseResponse {
  results: Array<{
    c?: number[]; // conditions
    f?: number; // TRF timestamp
    i: string; // trade ID
    p: number; // price
    s: number; // size
    t: number; // timestamp
    x: number; // exchange
    y?: number; // TRF timestamp
    z?: number; // tape
  }>;
}

// Quotes API Types
export interface QuotesResponse extends PolygonBaseResponse {
  results: Array<{
    P: number; // bid price
    S: number; // bid size
    c?: number[]; // conditions
    f?: number; // TRF timestamp
    i?: number[]; // indicators
    p: number; // ask price
    s: number; // ask size
    t: number; // timestamp
    x: number; // bid exchange
    X: number; // ask exchange
    y?: number; // TRF timestamp
    z?: number; // tape
  }>;
}

// Financials API Types
export interface FinancialsResponse extends PolygonBaseResponse {
  results: Array<{
    cik: string;
    company_name: string;
    start_date: string;
    end_date: string;
    filing_date: string;
    acceptance_datetime: string;
    timeframe: 'annual' | 'quarterly';
    fiscal_period: string;
    fiscal_year: string;
    source_filing_url: string;
    source_filing_file_url: string;
    financials: {
      balance_sheet?: {
        [key: string]: {
          label: string;
          value: number;
          unit: string;
          order: number;
        };
      };
      income_statement?: {
        [key: string]: {
          label: string;
          value: number;
          unit: string;
          order: number;
        };
      };
      cash_flow_statement?: {
        [key: string]: {
          label: string;
          value: number;
          unit: string;
          order: number;
        };
      };
      comprehensive_income?: {
        [key: string]: {
          label: string;
          value: number;
          unit: string;
          order: number;
        };
      };
    };
  }>;
}

// WebSocket Types
export interface WebSocketAuthMessage {
  action: 'auth';
  params: string;
}

export interface WebSocketSubscribeMessage {
  action: 'subscribe';
  params: string;
}

export interface WebSocketUnsubscribeMessage {
  action: 'unsubscribe';
  params: string;
}

export interface WebSocketStatusMessage {
  ev: 'status';
  status: string;
  message: string;
}

export interface WebSocketTradeMessage {
  ev: 'T'; // Trade
  sym: string; // Symbol
  i: string; // Trade ID
  x: number; // Exchange
  p: number; // Price
  s: number; // Size
  c?: number[]; // Conditions
  t: number; // Timestamp
}

export interface WebSocketQuoteMessage {
  ev: 'Q'; // Quote
  sym: string; // Symbol
  c?: number; // Condition
  bx: number; // Bid Exchange
  ax: number; // Ask Exchange
  bp: number; // Bid Price
  ap: number; // Ask Price
  bs: number; // Bid Size
  as: number; // Ask Size
  t: number; // Timestamp
  f?: number; // TRF Timestamp
}

export interface WebSocketAggregateMessage {
  ev: 'A'; // Second Aggregate
  sym: string; // Symbol
  v: number; // Volume
  av: number; // Accumulated Volume
  op: number; // Official Open Price
  vw: number; // Volume Weighted Average Price
  o: number; // Open Price
  c: number; // Close Price
  h: number; // High Price
  l: number; // Low Price
  a: number; // Average/VWAP
  s: number; // Start Timestamp
  e: number; // End Timestamp
}

export interface WebSocketMinuteAggregateMessage {
  ev: 'AM'; // Minute Aggregate
  sym: string; // Symbol
  v: number; // Volume
  av: number; // Accumulated Volume
  op: number; // Official Open Price
  vw: number; // Volume Weighted Average Price
  o: number; // Open Price
  c: number; // Close Price
  h: number; // High Price
  l: number; // Low Price
  a: number; // Average/VWAP
  s: number; // Start Timestamp
  e: number; // End Timestamp
  n: number; // Number of trades
}

export type WebSocketMessage =
  | WebSocketStatusMessage
  | WebSocketTradeMessage
  | WebSocketQuoteMessage
  | WebSocketAggregateMessage
  | WebSocketMinuteAggregateMessage;

// Error Types
export interface PolygonError {
  error: string;
  message?: string;
  status: string;
  request_id: string;
}

// Client Configuration
export interface PolygonClientConfig {
  apiKey: string;
  baseUrl?: string;
  websocketUrl?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// Query Parameters
export interface TickerSearchParams {
  search?: string;
  type?: string;
  market?: 'stocks' | 'crypto' | 'fx';
  exchange?: string;
  cusip?: string;
  cik?: string;
  date?: string;
  active?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  'ticker.gte'?: string;
  'ticker.gt'?: string;
  'ticker.lte'?: string;
  'ticker.lt'?: string;
}

export interface AggregatesParams {
  ticker: string;
  multiplier: number;
  timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  from: string; // YYYY-MM-DD format
  to: string; // YYYY-MM-DD format
  adjusted?: boolean;
  sort?: 'asc' | 'desc';
  limit?: number;
}

export interface NewsParams {
  ticker?: string;
  published_utc?: string;
  'published_utc.gte'?: string;
  'published_utc.gt'?: string;
  'published_utc.lte'?: string;
  'published_utc.lt'?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  sort?: 'published_utc' | 'ticker';
}