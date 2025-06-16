# Vercel Import Guide

GitHubリポジトリをVercelにインポートする手順：

## 1. Vercelにログイン
https://vercel.com にアクセスしてログイン

## 2. 新しいプロジェクトをインポート
1. ダッシュボードで「Add New...」→「Project」をクリック
2. 「Import Git Repository」セクションを選択

## 3. GitHubリポジトリを選択
1. GitHubアカウントを接続（まだの場合）
2. リポジトリ一覧から `WebAppAI0410/news-feed-summarizer` を選択
3. 「Import」をクリック

## 4. プロジェクト設定
- **Project Name**: news-feed-summarizer（またはお好みの名前）
- **Framework Preset**: Next.js（自動検出されるはず）
- **Root Directory**: ./（そのまま）

## 5. 環境変数の設定
以下の環境変数を追加（値は`.env.local`ファイルから取得）：

- `DATABASE_URL`
- `NEON_API_KEY`
- `NEXTAUTH_URL` (https://your-vercel-url.vercel.app に設定)
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY`
- `CRON_SECRET`
- `CLOUDFLARE_WORKERS_API_KEY`
- `AUTH_TRUST_HOST` (true に設定)

**注意**: `NEXTAUTH_URL`はデプロイ後に実際のVercel URLに更新してください

## 6. デプロイ
「Deploy」をクリックしてデプロイを開始

## リポジトリURL
https://github.com/WebAppAI0410/news-feed-summarizer

## トラブルシューティング
- ビルドエラーが発生した場合は、ログを確認してください
- 環境変数が正しく設定されているか確認してください
- Node.jsバージョンは18以上が必要です