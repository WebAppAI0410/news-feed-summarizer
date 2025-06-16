# Cron Jobs 設定ガイド

## 概要
このディレクトリには、定期実行されるcronジョブのエンドポイントが含まれています。

## Vercel Cron Jobs
Vercelの無料プランでは以下の制限があります：
- 最大2つのcronジョブ
- 最短実行間隔：1時間に1回
- 実行時間制限：10秒（Hobbyプラン）

## 現在の設定

### `/api/cron/fetch-feeds`
- **実行間隔**: 10分ごと（※Proプラン以上が必要）
- **機能**: アクティブなRSSフィードから最新記事を取得
- **タイムアウト**: 5分（300秒）
- **認証**: X-Cron-SecretヘッダーまたはAuthorizationヘッダー

## セキュリティ設定

### 環境変数
```env
CRON_SECRET=your-secure-random-string
```

### 認証方法
1. **Vercel Cron**（推奨）
   - Authorizationヘッダーを使用
   - Vercelが自動的に認証を処理

2. **Cloudflare Workers**（バックアップ）
   - X-Cron-Secretヘッダーを使用
   - X-API-Keyヘッダー（オプション）

## Cloudflare Workers設定（オプション）

より頻繁な実行が必要な場合、Cloudflare Workersを使用できます：

```javascript
// cloudflare-worker.js
addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled())
})

async function handleScheduled() {
  const response = await fetch('https://your-app.vercel.app/api/cron/fetch-feeds', {
    method: 'POST',
    headers: {
      'X-Cron-Secret': CRON_SECRET,
      'X-API-Key': CLOUDFLARE_API_KEY
    }
  })
  
  console.log('RSS fetch result:', await response.json())
}
```

## ローカル開発

ローカルでcronジョブをテストする場合：

```bash
# curlを使用
curl -X POST http://localhost:3000/api/cron/fetch-feeds \
  -H "X-Cron-Secret: your-secure-cron-secret"

# HTTPieを使用
http POST localhost:3000/api/cron/fetch-feeds \
  X-Cron-Secret:your-secure-cron-secret
```

## トラブルシューティング

### エラー: Unauthorized
- `CRON_SECRET`環境変数が正しく設定されているか確認
- Vercelの環境変数設定を確認

### エラー: Timeout
- RSS フィードのレスポンス時間を確認
- 並列処理の数を調整（現在は全フィード並列）
- タイムアウト設定を増やす（最大300秒）

### エラー: Rate Limit
- RSS配信元のレート制限を確認
- 実行間隔を調整
- フィードを時間差で取得するよう修正