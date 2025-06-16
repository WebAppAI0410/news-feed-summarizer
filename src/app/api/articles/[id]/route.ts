import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { articles, feeds } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 個別記事の詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;
    
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }
    
    // 記事とフィード情報を結合して取得
    const articleData = await db
      .select({
        // 記事情報
        id: articles.id,
        title: articles.title,
        link: articles.link,
        description: articles.description,
        content: articles.content,
        contentSnippet: articles.contentSnippet,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        guid: articles.guid,
        author: articles.author,
        creator: articles.creator,
        categories: articles.categories,
        // フィード情報
        feedId: articles.feedId,
        feedTitle: feeds.title,
        feedSource: feeds.source,
        feedCategory: feeds.category,
        feedUrl: feeds.url,
        feedOrganization: feeds.organization,
        feedCountry: feeds.country,
        feedLanguage: feeds.language,
      })
      .from(articles)
      .leftJoin(feeds, eq(articles.feedId, feeds.id))
      .where(eq(articles.id, articleId))
      .limit(1);
    
    if (articleData.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(articleData[0]);
  } catch (error) {
    console.error('Failed to fetch article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// 個別記事の更新（必要に応じて）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;
    const body = await request.json();
    
    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }
    
    // 既存記事の確認
    const existingArticle = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);
    
    if (existingArticle.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    // 更新可能フィールドのみ許可
    const updateData: {
      updatedAt: Date;
      title?: string;
      description?: string | null;
      content?: string | null;
      categories?: string[];
    } = {
      updatedAt: new Date(),
    };
    
    // 一般的に更新したいフィールド
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.categories !== undefined) updateData.categories = body.categories;
    
    const [updatedArticle] = await db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, articleId))
      .returning();
    
    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('Failed to update article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// 個別記事の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;
    
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