#!/bin/bash

# Vercel環境変数設定スクリプト（curl版）
# 使用方法: DATABASE_URL="your_neon_url" ./scripts/set-env-curl.sh

echo "🚀 Vercel環境変数設定スクリプト（curl版）"
echo "============================================"

# プロジェクトID
PROJECT_ID="prj_TTsFvkhuXrd55uY41lXRCiR4DhCh"
TEAM_ID="team_L8IeSgAXkHFpHhk0IuLqFEnK"

# Vercel APIトークンの確認
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN環境変数が設定されていません。"
  echo "以下の手順で取得してください："
  echo "1. https://vercel.com/account/tokens にアクセス"
  echo "2. 'Create Token' をクリック"
  echo "3. トークンをコピーして以下のコマンドで設定："
  echo "   export VERCEL_TOKEN=your_token_here"
  exit 1
fi

# DATABASE_URLの確認
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL環境変数が設定されていません。"
  echo "以下のコマンドで設定してください："
  echo "export DATABASE_URL='postgresql://username:password@ep-xxx.ap-northeast-1.aws.neon.tech/neondb?sslmode=require'"
  exit 1
fi

echo "✅ 環境変数設定を開始します..."

# 環境変数の定義
declare -A ENV_VARS=(
  ["DATABASE_URL"]="$DATABASE_URL"
  ["NEXTAUTH_URL"]="https://rss-news-summarizer-webappai0410s-projects.vercel.app"
  ["NEXTAUTH_SECRET"]="cBepd/dXQdUojFiPwB8CCrh6jweequN4/mrSKkT8cC8="
  ["AUTH_TRUST_HOST"]="true"
  ["CRON_SECRET"]="11j2oKo+8IbSlkLMUN5kv9TCIXKi5JLAGNr11xTQVko="
  ["OPENAI_API_KEY"]="${OPENAI_API_KEY:-your-openai-api-key-here}"
)

# 各環境変数を設定
for key in "${!ENV_VARS[@]}"; do
  value="${ENV_VARS[$key]}"
  
  echo "Setting $key..."
  
  response=$(curl -s -X POST \
    "https://api.vercel.com/v9/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"key\": \"$key\",
      \"value\": \"$value\",
      \"type\": \"encrypted\",
      \"target\": [\"production\", \"preview\", \"development\"]
    }")
  
  if echo "$response" | grep -q '"uid"'; then
    echo "✅ $key 設定完了"
  else
    echo "❌ $key 設定失敗: $response"
  fi
done

echo ""
echo "🎉 環境変数の設定が完了しました！"
echo ""
echo "📌 次のステップ:"
echo "1. 新しいデプロイを確認: https://vercel.com/webappai0410s-projects/rss-news-summarizer"
echo "2. デプロイ成功後、データベースを初期化:"
echo "   curl -X POST https://rss-news-summarizer-webappai0410s-projects.vercel.app/api/setup/database \\"
echo "     -H \"Authorization: Bearer 11j2oKo+8IbSlkLMUN5kv9TCIXKi5JLAGNr11xTQVko=\""