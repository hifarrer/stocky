import { NextRequest, NextResponse } from 'next/server';

// Determine base URL - only use Pro URL if explicitly configured
function getCoinGeckoBaseUrl(): string {
  // Check if Pro API is explicitly enabled
  const usePro = process.env.COINGECKO_USE_PRO === 'true';
  
  if (usePro) {
    return 'https://pro-api.coingecko.com/api/v3';
  }
  
  // Default to standard URL for free tier and Demo keys
  return 'https://api.coingecko.com/api/v3';
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get parameters from query string
    const vs_currency = searchParams.get('vs_currency') || 'usd';
    const order = searchParams.get('order') || 'market_cap_desc';
    const per_page = searchParams.get('per_page') || '100';
    const page = searchParams.get('page') || '1';
    const sparkline = searchParams.get('sparkline') || 'false';
    const price_change_percentage = searchParams.get('price_change_percentage') || '24h';

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
    const usePro = process.env.COINGECKO_USE_PRO === 'true';
    
    // Get correct base URL
    const baseUrl = getCoinGeckoBaseUrl();

    // Build CoinGecko API URL
    const url = new URL(`${baseUrl}/coins/markets`);
    url.searchParams.append('vs_currency', vs_currency);
    url.searchParams.append('order', order);
    url.searchParams.append('per_page', per_page);
    url.searchParams.append('page', page);
    url.searchParams.append('sparkline', sparkline);
    url.searchParams.append('price_change_percentage', price_change_percentage);
    
    // Set up headers
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    // Add API key to headers if available
    if (apiKey) {
      // Use Pro header only if explicitly configured
      const headerName = usePro ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';
      headers[headerName] = apiKey;
      console.log('Using CoinGecko with header:', headerName, 'and base URL:', baseUrl);
    } else {
      console.log('Using CoinGecko free tier (no API key) with base URL:', baseUrl);
    }

    console.log('Fetching from CoinGecko:', url.toString());

    // Make request to CoinGecko
    const response = await fetch(url.toString(), {
      headers,
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinGecko API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch crypto data',
          status: response.status,
          message: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('CoinGecko data received:', data.length, 'coins');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Crypto markets API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

