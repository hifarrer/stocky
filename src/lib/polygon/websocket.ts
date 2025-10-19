import {
  WebSocketMessage,
  WebSocketAuthMessage,
  WebSocketSubscribeMessage,
  WebSocketUnsubscribeMessage,
} from '@/types/polygon';

export interface WebSocketClientConfig {
  apiKey: string;
  wsUrl?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

export interface WebSocketEventHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
  onMaxReconnectAttemptsReached?: () => void;
  onAuthenticated?: () => void;
  onAuthenticationFailed?: (error: string) => void;
}

export class PolygonWebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private handlers: WebSocketEventHandlers;
  private isAuthenticated = false;
  private subscribedChannels = new Set<string>();
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private pingIntervalId: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(config: WebSocketClientConfig, handlers: WebSocketEventHandlers = {}) {
    this.config = {
      wsUrl: 'wss://socket.polygon.io/stocks',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      ...config,
    };
    this.handlers = handlers;
  }

  /**
   * Connect to the WebSocket
   */
  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.config.wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);

    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.clearTimeouts();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isAuthenticated = false;
    this.subscribedChannels.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to ticker updates
   */
  async subscribe(channels: string[]): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('WebSocket not authenticated');
    }

    const channelsToSubscribe = channels.filter(channel => !this.subscribedChannels.has(channel));
    
    if (channelsToSubscribe.length === 0) {
      return;
    }

    const message: WebSocketSubscribeMessage = {
      action: 'subscribe',
      params: channelsToSubscribe.join(','),
    };

    this.sendMessage(message);
    
    // Track subscriptions
    channelsToSubscribe.forEach(channel => {
      this.subscribedChannels.add(channel);
    });
  }

  /**
   * Unsubscribe from ticker updates
   */
  async unsubscribe(channels: string[]): Promise<void> {
    if (!this.isAuthenticated) {
      return;
    }

    const channelsToUnsubscribe = channels.filter(channel => this.subscribedChannels.has(channel));
    
    if (channelsToUnsubscribe.length === 0) {
      return;
    }

    const message: WebSocketUnsubscribeMessage = {
      action: 'unsubscribe',
      params: channelsToUnsubscribe.join(','),
    };

    this.sendMessage(message);
    
    // Remove from tracking
    channelsToUnsubscribe.forEach(channel => {
      this.subscribedChannels.delete(channel);
    });
  }

  /**
   * Subscribe to trades for a ticker
   */
  async subscribeToTrades(tickers: string[]): Promise<void> {
    const channels = tickers.map(ticker => `T.${ticker.toUpperCase()}`);
    await this.subscribe(channels);
  }

  /**
   * Subscribe to quotes for a ticker
   */
  async subscribeToQuotes(tickers: string[]): Promise<void> {
    const channels = tickers.map(ticker => `Q.${ticker.toUpperCase()}`);
    await this.subscribe(channels);
  }

  /**
   * Subscribe to aggregates (minute bars) for a ticker
   */
  async subscribeToAggregates(tickers: string[]): Promise<void> {
    const channels = tickers.map(ticker => `A.${ticker.toUpperCase()}`);
    await this.subscribe(channels);
  }

  /**
   * Subscribe to minute aggregates for a ticker
   */
  async subscribeToMinuteAggregates(tickers: string[]): Promise<void> {
    const channels = tickers.map(ticker => `AM.${ticker.toUpperCase()}`);
    await this.subscribe(channels);
  }

  /**
   * Subscribe to all data types for tickers
   */
  async subscribeToAll(tickers: string[]): Promise<void> {
    const allChannels: string[] = [];
    
    tickers.forEach(ticker => {
      const upperTicker = ticker.toUpperCase();
      allChannels.push(
        `T.${upperTicker}`,  // Trades
        `Q.${upperTicker}`,  // Quotes
        `A.${upperTicker}`,  // Aggregates
        `AM.${upperTicker}`  // Minute Aggregates
      );
    });

    await this.subscribe(allChannels);
  }

  /**
   * Unsubscribe from all channels for tickers
   */
  async unsubscribeFromTickers(tickers: string[]): Promise<void> {
    const channelsToRemove: string[] = [];
    
    tickers.forEach(ticker => {
      const upperTicker = ticker.toUpperCase();
      ['T', 'Q', 'A', 'AM'].forEach(prefix => {
        const channel = `${prefix}.${upperTicker}`;
        if (this.subscribedChannels.has(channel)) {
          channelsToRemove.push(channel);
        }
      });
    });

    if (channelsToRemove.length > 0) {
      await this.unsubscribe(channelsToRemove);
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    authenticated: boolean;
    subscribedChannels: string[];
    reconnectAttempts: number;
  } {
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      authenticated: this.isAuthenticated,
      subscribedChannels: Array.from(this.subscribedChannels),
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Authenticate
    this.authenticate();
    
    // Start ping interval
    this.startPingInterval();
    
    this.handlers.onOpen?.();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.clearTimeouts();
    
    this.handlers.onClose?.(event);
    
    // Attempt to reconnect if it wasn't a manual close
    if (this.shouldReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.handlers.onMaxReconnectAttemptsReached?.();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(error: Event): void {
    this.isConnecting = false;
    this.handlers.onError?.(error);
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const messages = JSON.parse(event.data);
      
      // Handle array of messages
      if (Array.isArray(messages)) {
        messages.forEach(message => this.processMessage(message));
      } else {
        this.processMessage(messages);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Process individual message
   */
  private processMessage(message: WebSocketMessage | { ev: string; status?: string; message?: string }): void {
    // Handle status messages
    if (message.ev === 'status') {
      if (message.status === 'auth_success') {
        this.isAuthenticated = true;
        this.handlers.onAuthenticated?.();
        // Re-subscribe to previously subscribed channels
        this.resubscribeToChannels();
      } else if (message.status === 'auth_failed') {
        console.error('WebSocket authentication failed:', message.message);
        this.handlers.onAuthenticationFailed?.(message.message || 'Authentication failed');
        this.disconnect();
      }
      return;
    }

    // Handle data messages
    if (this.isAuthenticated) {
      this.handlers.onMessage?.(message as WebSocketMessage);
    }
  }

  /**
   * Authenticate with the WebSocket
   */
  private authenticate(): void {
    const authMessage: WebSocketAuthMessage = {
      action: 'auth',
      params: this.config.apiKey,
    };
    
    this.sendMessage(authMessage);
  }

  /**
   * Send message to WebSocket
   */
  private sendMessage(message: WebSocketAuthMessage | WebSocketSubscribeMessage | WebSocketUnsubscribeMessage | { action: string }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    
    this.reconnectTimeoutId = setTimeout(() => {
      this.handlers.onReconnect?.(this.reconnectAttempts);
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.config.reconnectInterval * this.reconnectAttempts);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingIntervalId = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({ action: 'ping' });
      }
    }, this.config.pingInterval);
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  /**
   * Re-subscribe to previously subscribed channels after reconnection
   */
  private async resubscribeToChannels(): Promise<void> {
    if (this.subscribedChannels.size > 0) {
      const channels = Array.from(this.subscribedChannels);
      this.subscribedChannels.clear(); // Clear to avoid duplicates
      await this.subscribe(channels);
    }
  }
}