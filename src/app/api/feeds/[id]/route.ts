import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeds, articles } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

// 個別フィードの詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: feedId } = await params;
    
    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }
    
    // フィード情報を取得
    const feedData = await db
      .select()
      .from(feeds)
      .where(eq(feeds.id, feedId))
      .limit(1);
    
    if (feedData.length === 0) {
      return NextResponse.json(
        { error: 'Feed not found' },
        { status: 404 }
      );
    }
    
    // 関連記事数を取得
    const [{ count: articleCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.feedId, feedId));
    
    // 最新記事を取得（最大5件）
    const recentArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        link: articles.link,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
      })
      .from(articles)
      .where(eq(articles.feedId, feedId))
      .orderBy(sql`${articles.publishedAt} DESC`)
      .limit(5);
    
    return NextResponse.json({
      ...feedData[0],
      articleCount,
      recentArticles,
    });
  } catch (error) {
    console.error('Failed to fetch feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

// 個別フィード更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: feedId } = await params;
    const body = await request.json();
    
    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }
    
    const { title, url, description, category, source, organization, country, language, isActive } = body;
    
    // 既存フィードの確認
    const existingFeed = await db
      .select()
      .from(feeds)
      .where(eq(feeds.id, feedId))
      .limit(1);
    
    if (existingFeed.length === 0) {
      return NextResponse.json(
        { error: 'Feed not found' },
        { status: 404 }
      );
    }
    
    // URL重複チェック（異なるIDのフィードで同じURLがないか）
    if (url && url !== existingFeed[0].url) {
      const duplicateUrlFeed = await db
        .select()
        .from(feeds)
        .where(eq(feeds.url, url))
        .limit(1);
      
      if (duplicateUrlFeed.length > 0 && duplicateUrlFeed[0].id !== feedId) {
        return NextResponse.json(
          { error: 'Feed URL already exists' },
          { status: 409 }
        );
      }
    }
    
    // 更新データの準備
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (title !== undefined) updateData.title = title;
    if (url !== undefined) updateData.url = url;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (source !== undefined) updateData.source = source;
    if (organization !== undefined) updateData.organization = organization;
    if (country !== undefined) updateData.country = country;
    if (language !== undefined) updateData.language = language;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const [updatedFeed] = await db
      .update(feeds)
      .set(updateData)
      .where(eq(feeds.id, feedId))
      .returning();
    
    return NextResponse.json(updatedFeed);
  } catch (error) {
    console.error('Failed to update feed:', error);
    return NextResponse.json(
      { error: 'Failed to update feed' },
      { status: 500 }
    );
  }
}

// 個別フィード削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: feedId } = await params;
    
    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }
    
    // 関連記事数の確認
    const [{ count: articleCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(eq(articles.feedId, feedId));
    
    // トランザクションで関連記事とフィードを削除
    await db.transaction(async (tx) => {
      // 関連記事を削除
      if (articleCount > 0) {
        await tx.delete(articles).where(eq(articles.feedId, feedId));
      }
      
      // フィードを削除
      await tx.delete(feeds).where(eq(feeds.id, feedId));
    });
    
    return NextResponse.json({
      message: 'Feed and related articles deleted successfully',
      deletedArticleCount: articleCount,
    });
  } catch (error) {
    console.error('Failed to delete feed:', error);
    return NextResponse.json(
      { error: 'Failed to delete feed' },
      { status: 500 }
    );
  }
}