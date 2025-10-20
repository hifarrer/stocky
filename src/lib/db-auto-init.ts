import { Pool } from 'pg';

// Simple, direct database initialization
export async function initializeDatabaseDirectly(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('⚠️ DATABASE_URL not set');
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production' || 
                      connectionString.includes('render.com') || 
                      connectionString.includes('vercel.com');

  console.log('🔧 Direct database initialization...');

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    
    // Check if portfolios table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios'
      );
    `);

    if (result.rows[0].exists) {
      console.log('✅ Database already initialized');
      return;
    }

    console.log('⏳ Creating database tables...');

    // Create essential tables
    await client.query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(100) UNIQUE,
          password_hash VARCHAR(255),
          provider VARCHAR(50) DEFAULT 'local',
          provider_id VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login_at TIMESTAMP WITH TIME ZONE
      );

      -- User preferences table
      CREATE TABLE IF NOT EXISTS user_preferences (
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

      -- Portfolios table
      CREATE TABLE IF NOT EXISTS portfolios (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          is_default BOOLEAN DEFAULT false,
          color VARCHAR(7),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_user_portfolio_name UNIQUE (user_id, name)
      );

      -- Portfolio items table
      CREATE TABLE IF NOT EXISTS portfolio_items (
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

      -- Market data cache table
      CREATE TABLE IF NOT EXISTS market_data_cache (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          symbol VARCHAR(10) NOT NULL,
          market_type VARCHAR(10) NOT NULL CHECK (market_type IN ('stocks', 'crypto', 'forex')),
          data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('snapshot', 'historical', 'news', 'fundamentals')),
          timeframe VARCHAR(5),
          data JSONB NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_cache_entry UNIQUE (symbol, market_type, data_type, timeframe)
      );

      -- News cache table
      CREATE TABLE IF NOT EXISTS news_cache (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          article_id VARCHAR(100) UNIQUE NOT NULL,
          symbol VARCHAR(10),
          headline TEXT NOT NULL,
          summary TEXT,
          content TEXT,
          author VARCHAR(255),
          publisher_name VARCHAR(255) NOT NULL,
          publisher_url VARCHAR(500),
          article_url VARCHAR(500) NOT NULL,
          image_url VARCHAR(500),
          published_at TIMESTAMP WITH TIME ZONE NOT NULL,
          tickers TEXT[],
          keywords TEXT[],
          sentiment VARCHAR(10) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
          sentiment_score DECIMAL(3,2),
          category VARCHAR(50),
          language VARCHAR(10) DEFAULT 'en',
          is_featured BOOLEAN DEFAULT false,
          view_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- System configuration
      CREATE TABLE IF NOT EXISTS system_config (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          description TEXT,
          is_public BOOLEAN DEFAULT false,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
      CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
      CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id, is_default);
      CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio ON portfolio_items(portfolio_id);
      CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data_cache(symbol);
      CREATE INDEX IF NOT EXISTS idx_news_published ON news_cache(published_at DESC);

      -- Insert default system configuration
      INSERT INTO system_config (key, value, description, is_public) VALUES
      ('app_version', '"1.0.0"', 'Application version', true),
      ('maintenance_mode', 'false', 'Maintenance mode flag', true),
      ('features_enabled', '{"realTimeData": true, "priceAlerts": true, "newsIntegration": true, "socialFeatures": false, "advancedCharting": true}', 'Feature flags', true)
      ON CONFLICT (key) DO NOTHING;
    `);

    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}
