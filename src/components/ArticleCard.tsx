"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ExternalLink } from "lucide-react";

interface Article {
  id: string;
  feedId: string;
  title: string;
  description: string;
  url: string;
  publishedAt: number;
  createdAt: number;
}

interface Summary {
  id: string;
  articleId: string;
  content: string;
  createdAt: number;
}

interface ArticleCardProps {
  article: Article;
  summary?: Summary;
  feedName: string;
}

export function ArticleCard({ article, summary, feedName }: ArticleCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {article.title}
          </CardTitle>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="text-sm text-muted-foreground">
          <span>{feedName}</span>
          <span className="mx-2">•</span>
          <span>{format(new Date(article.publishedAt), "PPP", { locale: ja })}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {article.description}
        </p>
        {summary && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">AI要約</h3>
            <p className="text-sm">{summary.content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}