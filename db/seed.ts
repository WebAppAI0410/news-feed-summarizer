import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { feeds, type NewFeed } from "./schema";
import initialFeeds from "./seeds/initial-feeds.json";
import { nanoid } from "nanoid";

// Load environment variables
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  console.log("🌱 データベースのシーディングを開始します...");

  try {
    // 既存のフィードを削除（クリーンスタート）
    console.log("既存のデータをクリアしています...");
    await db.delete(feeds);

    // 初期フィードデータを挿入
    console.log("初期フィードデータを挿入しています...");
    const feedsToInsert: NewFeed[] = initialFeeds.map((feed) => ({
      id: nanoid(),
      title: feed.title,
      url: feed.url,
      description: feed.description || null,
      category: feed.category,
      source: feed.source,
      language: feed.language || "ja",
      organization: feed.organization || null,
      country: feed.country || "JP",
      isActive: true,
      lastPolled: null,
      lastError: null,
      errorCount: 0,
    }));

    // バッチで挿入
    const batchSize = 50;
    for (let i = 0; i < feedsToInsert.length; i += batchSize) {
      const batch = feedsToInsert.slice(i, i + batchSize);
      await db.insert(feeds).values(batch);
      console.log(`✅ ${Math.min(i + batchSize, feedsToInsert.length)}/${feedsToInsert.length} フィードを挿入しました`);
    }

    console.log(`🎉 シーディング完了！合計 ${feedsToInsert.length} 件のフィードを登録しました。`);

    // カテゴリ別の統計を表示
    const categoryStats = feedsToInsert.reduce((acc, feed) => {
      acc[feed.category] = (acc[feed.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📊 カテゴリ別統計:");
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}件`);
    });

  } catch (error) {
    console.error("❌ シーディング中にエラーが発生しました:", error);
    process.exit(1);
  }
}

// スクリプトを実行
seed()
  .then(() => {
    console.log("✨ シーディングスクリプトが正常に完了しました");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 予期しないエラーが発生しました:", error);
    process.exit(1);
  });