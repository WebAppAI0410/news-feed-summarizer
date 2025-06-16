"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, RefreshCw, Plus, Globe, Building2, Users, Tv } from "lucide-react";
import { AddFeedDialog } from "@/components/AddFeedDialog";
import { ArticleCard } from "@/components/ArticleCard";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { ArticleWithFeed, Feed, Category } from "@/types";

// カテゴリーアイコンのマッピング
const categoryIcons = {
  "政府・官公庁": Building2,
  "企業": Users,
  "メディア": Tv,
  "国際機関": Globe,
};

// カテゴリーの色マッピング
const categoryColors = {
  "政府・官公庁": "bg-blue-100 text-blue-800",
  "企業": "bg-green-100 text-green-800",
  "メディア": "bg-purple-100 text-purple-800",
  "国際機関": "bg-orange-100 text-orange-800",
};

// デモデータ
const mockArticles = [
  {
    _id: "1",
    title: "経済産業省が令和6年度政策を発表",
    link: "https://www.meti.go.jp/example1",
    description: "経済産業省は、DX推進とGX実現に向けた施策を発表しました。",
    publishedAt: Date.now() - 3600000,
    feed: {
      title: "経済産業省",
      category: "政府・官公庁",
      source: "官公庁",
      language: "ja",
      organization: "経済産業省",
      country: "JP",
    },
  },
  {
    _id: "2",
    title: "Apple Announces New Product Launch",
    link: "https://www.apple.com/newsroom/example",
    description: "Apple unveils new innovative products for the upcoming season.",
    publishedAt: Date.now() - 7200000,
    feed: {
      title: "Apple Newsroom",
      category: "企業",
      source: "企業",
      language: "en",
      organization: "Apple Inc.",
      country: "US",
    },
  },
  {
    _id: "3",
    title: "UN Climate Change Report Released",
    link: "https://news.un.org/example",
    description: "United Nations releases comprehensive report on global climate action.",
    publishedAt: Date.now() - 10800000,
    feed: {
      title: "UN News",
      category: "国際機関",
      source: "国際機関",
      language: "en",
      organization: "United Nations",
      country: "INT",
    },
  },
  {
    _id: "4",
    title: "NHKニュース: 新型コロナ対策の最新情報",
    link: "https://www3.nhk.or.jp/news/example",
    description: "新型コロナウイルス対策に関する最新情報をお伝えします。",
    publishedAt: Date.now() - 14400000,
    feed: {
      title: "NHKニュース",
      category: "メディア",
      source: "メディア",
      language: "ja",
      organization: "NHK",
      country: "JP",
    },
  },
];

const mockFeeds = [
  { category: "政府・官公庁" },
  { category: "企業" },
  { category: "国際機関" },
  { category: "メディア" },
];

export default function Home() {
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // TanStack React Queryでデータ取得
  const { data: articles = mockArticles, isLoading: articlesLoading, error: articlesError } = useQuery<ArticleWithFeed[]>({
    queryKey: ['articles'],
    queryFn: async (): Promise<ArticleWithFeed[]> => {
      const response = await fetch('/api/articles');
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      return data.articles || [];
    },
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 10 * 60 * 1000, // 10分
  });

  const { data: feeds = mockFeeds, isLoading: feedsLoading } = useQuery<Feed[]>({
    queryKey: ['feeds'],
    queryFn: async (): Promise<Feed[]> => {
      const response = await fetch('/api/feeds');
      if (!response.ok) {
        throw new Error('Failed to fetch feeds');
      }
      return await response.json();
    },
    staleTime: 10 * 60 * 1000, // 10分
    gcTime: 20 * 60 * 1000, // 20分
  });

  const queryClient = useQueryClient();
  
  // カテゴリーでフィルタリング
  const filteredArticles = articles?.filter((article: ArticleWithFeed) => {
    if (!selectedCategory) return true;
    return article.feedCategory === selectedCategory;
  });
  
  // カテゴリー一覧を取得
  const categories = Array.from(new Set(feeds?.map((f: Feed) => f.category).filter(Boolean) || []));

  const addFeedMutation = useMutation({
    mutationFn: async (feedData: { url: string; title: string; category: string; source: string; description?: string }) => {
      const response = await fetch('/api/feeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add feed');
      }
      return response.json();
    },
    onSuccess: () => {
      // フィード一覧を再取得
      queryClient.invalidateQueries({ queryKey: ['feeds'] });
      setShowAddFeed(false);
    },
    onError: (error: any) => {
      console.error('Failed to add feed:', error.message);
    },
  });

  const handleAddFeed = (feed: { url: string; name: string; category: string }) => {
    addFeedMutation.mutate({
      url: feed.url,
      title: feed.name,
      category: feed.category,
      source: feed.category, // カテゴリーをソースとして使用
      description: `RSS feed from ${feed.name}`,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/cron/fetch-feeds', {
        method: 'POST',
        headers: {
          'X-Cron-Secret': process.env.NEXT_PUBLIC_CRON_SECRET || '',
        },
      });
      if (response.ok) {
        // フィードとアーティクルのキャッシュを無効化して再取得
        queryClient.invalidateQueries({ queryKey: ['feeds'] });
        queryClient.invalidateQueries({ queryKey: ['articles'] });
      }
    } catch (error) {
      console.error('Failed to refresh feeds:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Newspaper className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">RSS News Summarizer</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                更新
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddFeed(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                フィード追加
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* カテゴリーフィルター */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            すべて
          </Button>
          {categories.map((category: string) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons] || Globe;
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                {category}
              </Button>
            );
          })}
        </div>

        {/* 記事一覧 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles?.map((article: ArticleWithFeed) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant="secondary"
                    className={article.feedCategory ? categoryColors[article.feedCategory as keyof typeof categoryColors] : ""}
                  >
                    {article.feedCategory || "その他"}
                  </Badge>
                  {article.feedLanguage && (
                    <Badge variant="outline" className="ml-2">
                      {article.feedLanguage.toUpperCase()}
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {article.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{article.feedTitle || article.feedSource}</span>
                  <time>
                    {formatDistanceToNow(new Date(article.publishedAt), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </time>
                </div>
                
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
                >
                  記事を読む →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 記事がない場合 */}
        {filteredArticles?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {selectedCategory
                  ? `「${selectedCategory}」カテゴリーの記事はまだありません。`
                  : "まだ記事がありません。右上の「フィード追加」ボタンからRSSフィードを追加してください。"}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* ローディング状態 */}
        {(articlesLoading || feedsLoading) && (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* エラー状態 */}
        {articlesError && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-600">
                記事の取得中にエラーが発生しました: {articlesError.message}
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <AddFeedDialog
        open={showAddFeed}
        onOpenChange={setShowAddFeed}
        onAddFeed={handleAddFeed}
      />
    </div>
  );
}