-- Add portfolio alerts table for tracking price alerts on portfolio items
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

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_portfolio_alerts_updated_at BEFORE UPDATE ON portfolio_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE portfolio_alerts IS 'Price alerts for portfolio items with percentage-based triggers';
