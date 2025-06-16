import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feeds, articles } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// フィード一覧取得
export async function GET() {
  try {
    const allFeeds = await db
      .select()
      .from(feeds)
      .orderBy(desc(feeds.createdAt));

    return NextResponse.json(allFeeds);
  } catch (error) {
    console.error('Failed to fetch feeds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feeds' },
      { status: 500 }
    );
  }
}

// 新しいフィード追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, url, description, category, source, organization, country, language } = body;

    // バリデーション
    if (!title || !url || !category || !source) {
      return NextResponse.json(
        { error: 'Required fields: title, url, category, source' },
        { status: 400 }
      );
    }

    // 既存URLチェック
    const existingFeed = await db
      .select()
      .from(feeds)
      .where(eq(feeds.url, url))
      .limit(1);

    if (existingFeed.length > 0) {
      return NextResponse.json(
        { error: 'Feed URL already exists' },
        { status: 409 }
      );
    }

    const newFeed = {
      id: nanoid(),
      title,
      url,
      description: description || null,
      category,
      source,
      organization: organization || null,
      country: country || 'JP',
      language: language || 'ja',
      isActive: true,
      errorCount: 0,
    };

    const [insertedFeed] = await db
      .insert(feeds)
      .values(newFeed)
      .returning();

    return NextResponse.json(insertedFeed, { status: 201 });
  } catch (error) {
    console.error('Failed to create feed:', error);
    return NextResponse.json(
      { error: 'Failed to create feed' },
      { status: 500 }
    );
  }
}

// フィード更新
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('id');
    
    if (!feedId) {
      return NextResponse.json(
        { error: 'Feed ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
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

// フィード削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feedId = searchParams.get('id');
    
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