#!/bin/bash
set -e

echo "Starting Convex deployment..."

# デバッグ情報を表示
if [ -n "$CONVEX_DEPLOY_KEY" ]; then
  echo "✓ CONVEX_DEPLOY_KEY is set (length: ${#CONVEX_DEPLOY_KEY})"
  echo "✓ Key prefix: ${CONVEX_DEPLOY_KEY:0:20}..."
else
  echo "✗ CONVEX_DEPLOY_KEY is not set"
  exit 1
fi

# Convexデプロイを実行
echo "Running convex deploy..."
npx convex deploy --cmd "next build"