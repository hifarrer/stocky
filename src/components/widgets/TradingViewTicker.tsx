'use client';

import React, { useEffect, useRef } from 'react';

export function TradingViewTicker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if script is already loaded for this container
    const widgetContainer = containerRef.current.querySelector(
      '.tradingview-widget-container__widget'
    );

    if (!widgetContainer) return;

    // Check if script already exists in this container
    const existingScript = widgetContainer.querySelector(
      'script[src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"]'
    );

    if (existingScript) {
      return;
    }

    // Create the script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        {
          proName: 'FOREXCOM:SPXUSD',
          title: 'S&P 500 Index',
        },
        {
          proName: 'FOREXCOM:NSXUSD',
          title: 'US 100 Cash CFD',
        },
        {
          proName: 'FX_IDC:EURUSD',
          title: 'EUR to USD',
        },
        {
          proName: 'BITSTAMP:BTCUSD',
          title: 'Bitcoin',
        },
        {
          proName: 'BITSTAMP:ETHUSD',
          title: 'Ethereum',
        },
        {
          proName: 'NASDAQ:AAPL',
          title: 'Apple',
        },
        {
          proName: 'NASDAQ:NVDA',
          title: 'Nvidia',
        },
      ],
      colorTheme: 'dark',
      locale: 'en',
      largeChartUrl: '',
      isTransparent: false,
      showSymbolLogo: true,
      displayMode: 'adaptive',
    });

    // Append script to the widget container
    widgetContainer.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="tradingview-ticker-wrapper w-full" style={{ isolation: 'isolate', contain: 'layout style paint' }}>
      <div className="tradingview-widget-container w-full" ref={containerRef}>
        <div className="tradingview-widget-container__widget"></div>
        <div className="tradingview-widget-copyright text-xs text-muted-foreground text-center py-1">
          <a
            href="https://www.tradingview.com/markets/"
            rel="noopener nofollow"
            target="_blank"
            className="hover:text-primary transition-colors"
          >
            <span className="text-primary">Ticker tape</span>
          </a>
          <span className="ml-1">by TradingView</span>
        </div>
      </div>
    </div>
  );
}

