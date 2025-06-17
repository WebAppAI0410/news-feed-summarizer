import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, feeds } from '@/db/schema';
import { eq, desc, and, like, gte, sql } from 'drizzle-orm';

// 記事一覧取得（フィルタリングとページネーション対応）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // クエリパラメータの取得
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // 最大100件
    const category = searchParams.get('category');
    const feedId = searchParams.get('feedId');
    const search = searchParams.get('search');
    const since = searchParams.get('since'); // YYYY-MM-DD形式
    
    // オフセット計算
    const offset = (page - 1) * limit;
    
    // フィルタリング条件を構築
    const conditions = [];
    
    if (category) {
      conditions.push(eq(feeds.category, category));
    }
    
    if (feedId) {
      conditions.push(eq(articles.feedId, feedId));
    }
    
    if (search) {
      conditions.push(
        like(articles.title, `%${search}%`)
      );
    }
    
    if (since) {
      const sinceDate = new Date(since);
      conditions.push(gte(articles.publishedAt, sinceDate));
    }
    
    // 基本クエリ（条件付き）
    const articlesData = await db
      .select({
        id: articles.id,
        title: articles.title,
        link: articles.link,
        description: articles.description,
        contentSnippet: articles.contentSnippet,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        author: articles.author,
        categories: articles.categories,
        feedId: articles.feedId,
        feedTitle: feeds.title,
        feedSource: feeds.source,
        feedCategory: feeds.category,
      })
      .from(articles)
      .leftJoin(feeds, eq(articles.feedId, feeds.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);
    
    // 総件数を取得（ページネーション用）
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .leftJoin(feeds, eq(articles.feedId, feeds.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return NextResponse.json({
      articles: articlesData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1,
      },
      filters: {
        category,
        feedId,
        search,
        since,
      },
    });
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// 記事の削除（必要に応じて）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('id');
    
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }
    
    // 記事を削除
    const [deletedArticle] = await db
      .delete(articles)
      .where(eq(articles.id, articleId))
      .returning();
    
    if (!deletedArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Article deleted successfully',
      article: deletedArticle,
    });
  } catch (error) {
    console.error('Failed to delete article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}