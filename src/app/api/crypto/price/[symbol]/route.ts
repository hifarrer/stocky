import { NextRequest, NextResponse } from 'next/server';

// Determine base URL - only use Pro URL if explicitly configured
function getCoinGeckoBaseUrl(): string {
  const usePro = process.env.COINGECKO_USE_PRO === 'true';
  
  if (usePro) {
    return 'https://pro-api.coingecko.com/api/v3';
  }
  
  return 'https://api.coingecko.com/api/v3';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: symbolParam } = await params;
  const symbol = symbolParam.toLowerCase();

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Get API key and base URL
    const apiKey = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
    const usePro = process.env.COINGECKO_USE_PRO === 'true';
    const baseUrl = getCoinGeckoBaseUrl();
    
    // Use simple price endpoint - first search for coin ID
    const searchUrl = `${baseUrl}/search?query=${encodeURIComponent(symbol)}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (apiKey) {
      const headerName = usePro ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';
      headers[headerName] = apiKey;
    }

    // Search for the coin to get its ID
    const searchResponse = await fetch(searchUrl, { headers });
    const searchData = await searchResponse.json();
    
    // Find matching coin
    const coin = searchData.coins?.find((c: { symbol: string; id: string; name: string }) => 
      c.symbol.toLowerCase() === symbol.toLowerCase()
    );
    
    if (!coin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cryptocurrency not found',
          symbol,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Get current price using coin ID
    const priceUrl = `${baseUrl}/simple/price?ids=${coin.id}&vs_currencies=usd`;
    const priceResponse = await fetch(priceUrl, { headers });
    const priceData = await priceResponse.json();
    
    const currentPrice = priceData[coin.id]?.usd;
    
    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        coin_id: coin.id,
        coin_name: coin.name,
        current_price: currentPrice || null,
        currency: 'usd',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Crypto price API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crypto price',
        symbol,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
