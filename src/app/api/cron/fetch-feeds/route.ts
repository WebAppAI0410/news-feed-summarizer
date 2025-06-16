import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeds, articles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { parseRSSFeed } from '@/lib/rss-parser';
import { nanoid } from 'nanoid';

// Cloudflare WorkersやVercel Cronから呼び出される
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const cronSecret = request.headers.get('X-Cron-Secret');
    const apiKey = request.headers.get('X-API-Key');
    
    if (cronSecret !== process.env.CRON_SECRET) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Cloudflare Workers APIキーの検証（オプション）
    if (apiKey && apiKey !== process.env.CLOUDFLARE_WORKERS_API_KEY) {
      return new NextResponse('Invalid API Key', { status: 401 });
    }

    // アクティブなフィードを取得
    const activeFeeds = await db
      .select()
      .from(feeds)
      .where(eq(feeds.isActive, true));
    
    const results = {
      successful: 0,
      failed: 0,
      total: activeFeeds.length,
      errors: [] as string[],
    };

    // 各フィードを並列で処理
    await Promise.all(
      activeFeeds.map(async (feed) => {
        try {
          // RSSフィードをパース
          const parsedFeed = await parseRSSFeed(feed.url);
          
          // 記事を保存
          for (const item of parsedFeed.items) {
            const articleId = nanoid();
            const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
            
            try {
              // 既存記事の確認（guidまたはlinkで重複チェック）
              const existingArticle = await db
                .select()
                .from(articles)
                .where(eq(articles.guid, item.guid || item.link))
                .limit(1);

              if (existingArticle.length === 0) {
                // 新規記事の場合のみ挿入
                await db.insert(articles).values({
                  id: articleId,
                  feedId: feed.id,
                  title: item.title || 'No Title',
                  link: item.link || '',
                  description: item.description || item.contentSnippet,
                  content: item.content,
                  contentSnippet: item.contentSnippet,
                  publishedAt,
                  guid: item.guid || item.link || articleId,
                  author: item.author,
                  creator: item.creator,
                  categories: item.categories || [],
                });
              }
            } catch (articleError) {
              console.error(`Failed to save article: ${item.title}`, articleError);
              // 個別記事のエラーはスキップして続行
            }
          }
          
          // フィードの最終取得時刻を更新
          await db
            .update(feeds)
            .set({
              lastPolled: new Date(),
              lastError: null, // 成功時はエラーをクリア
              errorCount: 0,
              updatedAt: new Date(),
            })
            .where(eq(feeds.id, feed.id));
          
          results.successful++;
        } catch (error) {
          console.error(`Failed to fetch feed ${feed.url}:`, error);
          results.failed++;
          results.errors.push(`${feed.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          // エラーを記録
          await db
            .update(feeds)
            .set({
              lastError: error instanceof Error ? error.message : 'Unknown error',
              errorCount: (feed.errorCount || 0) + 1,
              updatedAt: new Date(),
            })
            .where(eq(feeds.id, feed.id));
        }
      })
    );

    return NextResponse.json({
      message: 'RSS feeds fetched',
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Vercel Cron Jobs用のGETエンドポイント（互換性のため）
export async function GET(request: NextRequest) {
  // Vercel Cronは Authorization ヘッダーを使用
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  // POSTと同じ処理を実行
  const newRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: {
      'X-Cron-Secret': process.env.CRON_SECRET!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source: 'vercel-cron' }),
  });
  
  return POST(newRequest);
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5分