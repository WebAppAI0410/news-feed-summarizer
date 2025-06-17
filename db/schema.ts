// @ts-nocheck
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  json,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// RSSフィードテーブル
export const feeds = pgTable("feeds", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(), // 政府・官公庁、企業、メディア、国際機関
  source: text("source").notNull(),     // 情報ソース
  language: text("language").notNull().default("ja"),
  organization: text("organization"),
  country: text("country").notNull().default("JP"),
  isActive: boolean("isActive").notNull().default(true),
  lastPolled: timestamp("lastPolled"),
  lastError: text("lastError"),
  errorCount: integer("errorCount").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// 記事テーブル
export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  feedId: text("feedId")
    .notNull()
    .references(() => feeds.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  link: text("link").notNull().unique(),
  description: text("description"),
  content: text("content"),
  contentSnippet: text("contentSnippet"),
  publishedAt: timestamp("publishedAt").notNull(),
  guid: text("guid").notNull(),
  author: text("author"),
  creator: text("creator"),
  categories: json("categories").$type<string[]>().default([]),
  isRead: boolean("isRead").notNull().default(false),
  isFavorite: boolean("isFavorite").notNull().default(false),
  summary: text("summary"), // AI生成要約（将来用）
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// 要約テーブル（将来のAI機能用）
export const summaries = pgTable("summaries", {
  id: text("id").primaryKey(),
  articleId: text("articleId")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  model: text("model").notNull(), // 使用したAIモデル
  prompt: text("prompt"),
  tokensUsed: integer("tokensUsed"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// ユーザーテーブル（認証用）
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified"),
  name: text("name"),
  image: text("image"),
  password: text("password"), // ローカル認証用
  role: text("role").notNull().default("user"), // user, admin
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// アカウントテーブル（OAuth認証用）
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  userIdIdx: index("account_userId_idx").on(account.userId),
}));

// セッションテーブル
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
}, (session) => ({
  userIdIdx: index("session_userId_idx").on(session.userId),
}));

// 検証トークンテーブル
export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// ユーザー設定テーブル
export const userSettings = pgTable("user_settings", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  selectedCategories: json("selectedCategories").$type<string[]>().default([]),
  refreshInterval: integer("refreshInterval").notNull().default(600), // 秒単位
  enableNotifications: boolean("enableNotifications").notNull().default(false),
  theme: text("theme").notNull().default("system"), // light, dark, system
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// 型定義をエクスポート
export type Feed = typeof feeds.$inferSelect;
export type NewFeed = typeof feeds.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;