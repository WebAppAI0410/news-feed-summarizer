#!/bin/bash

# Vercel環境変数設定スクリプト

echo "🚀 Vercel環境変数を設定します..."

# プロジェクトディレクトリに移動
cd /mnt/c/Users/33916/news_feed/rss-news-summarizer

# 環境変数を一つずつ設定
echo "postgresql://neondb_owner:npg_JEHY3zWAbvr1@ep-square-cloud-a1xroruc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" | vercel env add DATABASE_URL production preview development --force

echo "https://rss-news-summarizer-webappai0410s-projects.vercel.app" | vercel env add NEXTAUTH_URL production preview development --force

echo "cBepd/dXQdUojFiPwB8CCrh6jweequN4/mrSKkT8cC8=" | vercel env add NEXTAUTH_SECRET production preview development --force

echo "true" | vercel env add AUTH_TRUST_HOST production preview development --force

echo "11j2oKo+8IbSlkLMUN5kv9TCIXKi5JLAGNr11xTQVko=" | vercel env add CRON_SECRET production preview development --force

echo "${OPENAI_API_KEY:-your-openai-api-key-here}" | vercel env add OPENAI_API_KEY production preview development --force

echo "✅ 環境変数の設定が完了しました！"