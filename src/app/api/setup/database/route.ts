import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeds } from '@/db/schema';
import { sql } from 'drizzle-orm';
import seedData from '@/db/seeds/initial-feeds.json';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // セットアップキーの確認（セキュリティ）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📋 データベースセットアップを開始...');

    // 1. テーブルの存在確認と作成
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS feeds (
          id text PRIMARY KEY,
          title text NOT NULL,
          url text NOT NULL UNIQUE,
          description text,
          category text NOT NULL,
          source text NOT NULL,
          organization text,
          country text NOT NULL DEFAULT 'JP',
          language text NOT NULL DEFAULT 'ja',
          "isActive" boolean NOT NULL DEFAULT true,
          "errorCount" integer NOT NULL DEFAULT 0,
          "lastPolled" timestamp,
          "lastError" text,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS articles (
          id text PRIMARY KEY,
          "feedId" text NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
          title text NOT NULL,
          link text NOT NULL UNIQUE,
          description text,
          content text,
          "contentSnippet" text,
          "publishedAt" timestamp NOT NULL,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp,
          guid text NOT NULL,
          author text,
          creator text,
          categories text[] DEFAULT '{}'
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id text PRIMARY KEY,
          name text,
          email text UNIQUE,
          "emailVerified" timestamp,
          image text,
          role text DEFAULT 'user',
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS accounts (
          id text PRIMARY KEY,
          "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type text NOT NULL,
          provider text NOT NULL,
          "providerAccountId" text NOT NULL,
          refresh_token text,
          access_token text,
          expires_at integer,
          token_type text,
          scope text,
          id_token text,
          session_state text,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp,
          UNIQUE(provider, "providerAccountId")
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS sessions (
          id text PRIMARY KEY,
          "sessionToken" text NOT NULL UNIQUE,
          "userId" text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires timestamp NOT NULL,
          "createdAt" timestamp NOT NULL DEFAULT now(),
          "updatedAt" timestamp
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS verification_tokens (
          identifier text NOT NULL,
          token text NOT NULL UNIQUE,
          expires timestamp NOT NULL,
          PRIMARY KEY (identifier, token)
        )
      `);

      console.log('✅ テーブル作成完了');
    } catch (error) {
      console.log('ℹ️ テーブルは既に存在します');
    }

    // 2. インデックスの作成
    try {
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles("feedId")`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles("publishedAt" DESC)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_feeds_category ON feeds(category)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_feeds_active ON feeds("isActive")`);
      console.log('✅ インデックス作成完了');
    } catch (error) {
      console.log('ℹ️ インデックスは既に存在します');
    }

    // 3. 初期フィードデータの投入
    const existingFeeds = await db.select().from(feeds).limit(1);
    
    if (existingFeeds.length === 0) {
      console.log('📥 初期フィードデータを投入中...');
      
      const feedsToInsert = seedData.map(feed => ({
        id: nanoid(),
        title: feed.title,
        url: feed.url,
        description: feed.description || null,
        category: feed.category,
        source: feed.source,
        organization: feed.organization || null,
        country: feed.country || 'JP',
        language: feed.language || 'ja',
        isActive: true,
        errorCount: 0,
        createdAt: new Date(),
      }));

      await db.insert(feeds).values(feedsToInsert);
      console.log(`✅ ${feedsToInsert.length}件のフィードデータを投入完了`);
    } else {
      console.log('ℹ️ フィードデータは既に存在します');
    }

    // 4. 統計情報の取得
    const feedCount = await db.execute(sql`SELECT COUNT(*) as count FROM feeds`);
    const articleCount = await db.execute(sql`SELECT COUNT(*) as count FROM articles`);
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);

    const stats = {
      feeds: feedCount.rows[0]?.count || 0,
      articles: articleCount.rows[0]?.count || 0,
      users: userCount.rows[0]?.count || 0,
    };

    return NextResponse.json({
      success: true,
      message: 'データベースセットアップが完了しました',
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ データベースセットアップエラー:', error);
    return NextResponse.json(
      { 
        error: 'データベースセットアップに失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}