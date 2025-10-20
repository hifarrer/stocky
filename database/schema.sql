-- BlockyFi Dashboard Database Schema
-- PostgreSQL implementation for production deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User management table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255), -- For local auth if implemented
    provider VARCHAR(50) DEFAULT 'local', -- 'local', 'google', 'github', etc.
    provider_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- User preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    default_symbol VARCHAR(10) DEFAULT 'AAPL',
    chart_timeframe VARCHAR(5) DEFAULT '1d',
    theme_preferences JSONB DEFAULT '{"darkMode": true, "primaryColor": "#00FF88", "accentColor": "#FF6B6B"}',
    watchlist TEXT[] DEFAULT ARRAY['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
    notification_settings JSONB DEFAULT '{"priceAlerts": true, "newsAlerts": false, "marketOpen": true, "emailNotifications": false}',
    layout_preferences JSONB DEFAULT '{"widgetOrder": ["chart", "snapshot", "heatmap", "news", "calendar"], "compactMode": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market data cache table
CREATE TABLE market_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    market_type VARCHAR(10) NOT NULL CHECK (market_type IN ('stocks', 'crypto', 'forex')),
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('snapshot', 'historical', 'news', 'fundamentals')),
    timeframe VARCHAR(5), -- For historical data: '1m', '5m', '1h', '1d', etc.
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Composite index for efficient lookups
    CONSTRAINT unique_cache_entry UNIQUE (symbol, market_type, data_type, timeframe)
);

-- News cache table
CREATE TABLE news_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id VARCHAR(100) UNIQUE NOT NULL, -- External article ID
    symbol VARCHAR(10), -- Can be NULL for general market news
    headline TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    author VARCHAR(255),
    publisher_name VARCHAR(255) NOT NULL,
    publisher_url VARCHAR(500),
    article_url VARCHAR(500) NOT NULL,
    image_url VARCHAR(500),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    tickers TEXT[], -- Array of related ticker symbols
    keywords TEXT[],
    sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
    category VARCHAR(50), -- 'earnings', 'market', 'politics', etc.
    language VARCHAR(10) DEFAULT 'en',
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User activity tracking
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    activity_type VARCHAR(50) NOT NULL, -- 'search', 'view_chart', 'add_watchlist', etc.
    data JSONB, -- Activity-specific data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Price alerts table
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'change_percent')),
    target_value DECIMAL(12,4) NOT NULL,
    current_value DECIMAL(12,4),
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking (for rate limiting and analytics)
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_hash VARCHAR(255), -- Hashed API key for identification
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Watchlist groups (for organizing symbols)
CREATE TABLE watchlist_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_group_name UNIQUE (user_id, name)
);

-- Watchlist items (many-to-many between users and symbols)
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES watchlist_groups(id) ON DELETE SET NULL,
    symbol VARCHAR(10) NOT NULL,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_symbol UNIQUE (user_id, symbol)
);

-- System configuration
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Whether this config is exposed to frontend
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
CREATE INDEX idx_users_active ON users(is_active, created_at);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

CREATE INDEX idx_market_data_symbol ON market_data_cache(symbol);
CREATE INDEX idx_market_data_type ON market_data_cache(market_type, data_type);
CREATE INDEX idx_market_data_expires ON market_data_cache(expires_at);
CREATE INDEX idx_market_data_created ON market_data_cache(created_at);

CREATE INDEX idx_news_symbol ON news_cache(symbol);
CREATE INDEX idx_news_published ON news_cache(published_at DESC);
CREATE INDEX idx_news_tickers ON news_cache USING GIN(tickers);
CREATE INDEX idx_news_keywords ON news_cache USING GIN(keywords);
CREATE INDEX idx_news_featured ON news_cache(is_featured, published_at DESC) WHERE is_featured = true;

CREATE INDEX idx_activity_user_id ON user_activity(user_id, created_at DESC);
CREATE INDEX idx_activity_type ON user_activity(activity_type, created_at DESC);
CREATE INDEX idx_activity_session ON user_activity(session_id);

CREATE INDEX idx_alerts_user_active ON price_alerts(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_alerts_symbol ON price_alerts(symbol, is_active);
CREATE INDEX idx_alerts_triggered ON price_alerts(is_triggered, triggered_at);

CREATE INDEX idx_api_usage_created ON api_usage(created_at DESC);
CREATE INDEX idx_api_usage_endpoint ON api_usage(endpoint, created_at DESC);
CREATE INDEX idx_api_usage_user ON api_usage(user_id, created_at DESC);

CREATE INDEX idx_watchlist_groups_user ON watchlist_groups(user_id, sort_order);
CREATE INDEX idx_watchlist_items_user ON watchlist_items(user_id, sort_order);
CREATE INDEX idx_watchlist_items_group ON watchlist_items(group_id, sort_order);
CREATE INDEX idx_watchlist_items_symbol ON watchlist_items(symbol);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_alerts_updated_at BEFORE UPDATE ON price_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlist_groups_updated_at BEFORE UPDATE ON watchlist_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM market_data_cache WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Default system configuration
INSERT INTO system_config (key, value, description, is_public) VALUES
('app_version', '"1.0.0"', 'Application version', true),
('maintenance_mode', 'false', 'Maintenance mode flag', true),
('max_watchlist_items', '50', 'Maximum items per user watchlist', false),
('cache_ttl_snapshot', '60', 'Snapshot data cache TTL in seconds', false),
('cache_ttl_historical', '300', 'Historical data cache TTL in seconds', false),
('cache_ttl_news', '600', 'News cache TTL in seconds', false),
('rate_limit_requests', '100', 'Rate limit requests per window', false),
('rate_limit_window_ms', '60000', 'Rate limit window in milliseconds', false),
('features_enabled', '{"realTimeData": true, "priceAlerts": true, "newsIntegration": true, "socialFeatures": false, "advancedCharting": true}', 'Feature flags', true);

-- Portfolio tables
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    color VARCHAR(7), -- Hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)
);

CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    market_type VARCHAR(10) NOT NULL CHECK (market_type IN ('stocks', 'crypto', 'forex')),
    quantity DECIMAL(15,8) NOT NULL DEFAULT 0,
    average_price DECIMAL(12,4),
    notes TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_portfolio_symbol UNIQUE (portfolio_id, symbol)
);

-- Indexes for portfolio tables
CREATE INDEX idx_portfolios_user ON portfolios(user_id, is_default);
CREATE INDEX idx_portfolio_items_portfolio ON portfolio_items(portfolio_id);
CREATE INDEX idx_portfolio_items_symbol ON portfolio_items(symbol);

-- Portfolio alerts table for tracking price alerts on portfolio items
CREATE TABLE portfolio_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('price_up', 'price_down', 'change_up', 'change_down')),
    target_value DECIMAL(12,4) NOT NULL,
    current_price DECIMAL(12,4),
    is_triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for portfolio alerts
CREATE INDEX idx_portfolio_alerts_user ON portfolio_alerts(user_id, is_active);
CREATE INDEX idx_portfolio_alerts_item ON portfolio_alerts(portfolio_item_id);
CREATE INDEX idx_portfolio_alerts_triggered ON portfolio_alerts(is_triggered, triggered_at);
CREATE INDEX idx_portfolio_alerts_active ON portfolio_alerts(is_active, created_at);

-- Triggers for portfolio timestamp updates
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_alerts_updated_at BEFORE UPDATE ON portfolio_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User account information and authentication data';
COMMENT ON TABLE user_preferences IS 'User-specific application preferences and settings';
COMMENT ON TABLE market_data_cache IS 'Cached market data from external APIs to reduce API calls and improve performance';
COMMENT ON TABLE news_cache IS 'Cached financial news articles with metadata and sentiment analysis';
COMMENT ON TABLE user_activity IS 'User activity tracking for analytics and usage patterns';
COMMENT ON TABLE price_alerts IS 'User-defined price alerts and notifications';
COMMENT ON TABLE api_usage IS 'API usage tracking for rate limiting and analytics';
COMMENT ON TABLE watchlist_groups IS 'User-defined groups for organizing watchlist items';
COMMENT ON TABLE watchlist_items IS 'Individual symbols in user watchlists';
COMMENT ON TABLE portfolios IS 'User portfolio containers for organizing investments';
COMMENT ON TABLE portfolio_items IS 'Individual holdings within user portfolios';
COMMENT ON TABLE portfolio_alerts IS 'Price alerts for portfolio items with percentage-based triggers';
COMMENT ON TABLE system_config IS 'System-wide configuration and feature flags';