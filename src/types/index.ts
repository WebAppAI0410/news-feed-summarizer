// API Response Types
export interface ArticleWithFeed {
  id: string;
  title: string;
  link: string;
  description?: string;
  content?: string;
  contentSnippet?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt?: string;
  guid: string;
  author?: string;
  creator?: string;
  categories: string[];
  // Feed Info
  feedId: string;
  feedTitle: string;
  feedSource: string;
  feedCategory: string;
  feedLanguage: string;
}

export interface Feed {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  source: string;
  organization?: string;
  country: string;
  language: string;
  isActive: boolean;
  errorCount: number;
  lastPolled?: string;
  lastError?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Article {
  id: string;
  feedId: string;
  title: string;
  link: string;
  description?: string;
  content?: string;
  contentSnippet?: string;
  publishedAt: string;
  createdAt: string;
  updatedAt?: string;
  guid: string;
  author?: string;
  creator?: string;
  categories: string[];
}

export interface FeedFormData {
  url: string;
  title: string;
  category: string;
  source: string;
  description?: string;
  organization?: string;
  country?: string;
  language?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ArticlesResponse {
  articles: ArticleWithFeed[];
  pagination: PaginationMeta;
  filters: {
    category?: string;
    feedId?: string;
    search?: string;
    since?: string;
  };
}

// RSS Parser Types
export interface RSSItem {
  title?: string;
  link?: string;
  description?: string;
  content?: string;
  contentSnippet?: string;
  pubDate?: string;
  guid?: string;
  author?: string;
  creator?: string;
  categories?: string[];
}

export interface RSSFeed {
  title?: string;
  description?: string;
  link?: string;
  items: RSSItem[];
}

// Category Types
export type Category = "政府・官公庁" | "企業" | "メディア" | "国際機関";

export const CATEGORIES: Category[] = [
  "政府・官公庁",
  "企業", 
  "メディア",
  "国際機関"
];