import { NextRequest, NextResponse } from 'next/server';
import { createPolygonClient } from '@/lib/polygon';

const polygonClient = createPolygonClient(
  process.env.POLYGON_API_KEY || process.env.NEXT_PUBLIC_POLYGON_API_KEY || 'demo'
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const ticker = searchParams.get('ticker');
  const days = parseInt(searchParams.get('days') || '7');

  try {
    let articles;

    if (ticker) {
      // Get news for specific ticker
      articles = await polygonClient.news.getTickerNews(
        ticker.toUpperCase(),
        limit,
        days
      );
    } else {
      // Get general market news
      articles = await polygonClient.news.getLatestNews(limit);
    }

    return NextResponse.json({
      success: true,
      data: articles,
      count: articles.length,
      ticker: ticker?.toUpperCase(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('News API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}