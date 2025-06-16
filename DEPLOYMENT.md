# Vercel Deployment via GitHub Actions

## 必要なGitHub Secrets

以下のシークレットをGitHubリポジトリに設定する必要があります：

1. `VERCEL_TOKEN` - Vercelのアクセストークン
2. `VERCEL_ORG_ID` - `team_L8IeSgAXkHFpHhk0IuLqFEnK`
3. `VERCEL_PROJECT_ID` - `prj_TTsFvkhuXrd55uY41lXRCiR4DhCh`

## Vercelトークンの取得方法

1. https://vercel.com/account/tokens にアクセス
2. "Create Token" をクリック
3. トークン名を入力（例: "GitHub Actions"）
4. スコープはデフォルトのままでOK
5. 作成されたトークンをコピー

## GitHubシークレットの設定方法

1. GitHubリポジトリの Settings → Secrets and variables → Actions
2. "New repository secret" をクリック
3. 上記の3つのシークレットを追加

設定が完了したら、mainブランチへのプッシュで自動的にVercelへデプロイされます。