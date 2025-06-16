import { NextRequest, NextResponse } from 'next/server';
import { parseRSSFeed } from '@/lib/rss-parser';

// クライアントからRSSフィードをパースするためのエンドポイント
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }
    
    const feed = await parseRSSFeed(url);
    return NextResponse.json(feed);
  } catch (error) {
    console.error('RSS parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse RSS feed' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';