const https = require('https');

// Vercel API設定
const VERCEL_API_TOKEN = 'uEegeQ59JlVSLfcNHXAmIwa3'; // VercelのAPIトークン
const PROJECT_ID = 'prj_TTsFvkhuXrd55uY41lXRCiR4DhCh';
const TEAM_ID = 'team_L8IeSgAXkHFpHhk0IuLqFEnK';

// 環境変数の設定
const envVars = {
  DATABASE_URL: 'postgresql://neondb_owner:npg_JEHY3zWAbvr1@ep-square-cloud-a1xroruc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  NEXTAUTH_URL: 'https://rss-news-summarizer-webappai0410s-projects.vercel.app',
  NEXTAUTH_SECRET: 'cBepd/dXQdUojFiPwB8CCrh6jweequN4/mrSKkT8cC8=',
  AUTH_TRUST_HOST: 'true',
  CRON_SECRET: '11j2oKo+8IbSlkLMUN5kv9TCIXKi5JLAGNr11xTQVko=',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
};

console.log('🚀 Vercel環境変数設定を開始します...\n');

// APIトークンの確認
if (VERCEL_API_TOKEN === 'YOUR_VERCEL_TOKEN') {
  console.error('❌ VercelのAPIトークンが設定されていません。');
  console.log('\n以下の手順でトークンを取得してください：');
  console.log('1. https://vercel.com/account/tokens にアクセス');
  console.log('2. "Create Token" をクリック');
  console.log('3. トークン名を入力（例: "RSS News Summarizer Setup"）');
  console.log('4. スコープはデフォルトのままでOK');
  console.log('5. "Create" をクリック');
  console.log('6. 表示されたトークンをコピー');
  console.log('7. このファイルの VERCEL_API_TOKEN = \'YOUR_VERCEL_TOKEN\' を置き換え');
  console.log('8. 再度このスクリプトを実行: node scripts/setup-vercel-env-direct.js');
  process.exit(1);
}

// 環境変数を設定する関数
function setEnvVar(key, value) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      key: key,
      value: value,
      type: 'encrypted',
      target: ['production', 'preview', 'development']
    });

    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ ${key} 設定完了`);
          resolve();
        } else {
          console.error(`❌ ${key} 設定失敗: ${res.statusCode}`);
          console.error(responseData);
          reject(new Error(`Failed to set ${key}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${key} 設定エラー:`, error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// すべての環境変数を設定
async function setupAllEnvVars() {
  for (const [key, value] of Object.entries(envVars)) {
    try {
      await setEnvVar(key, value);
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
    }
  }

  console.log('\n🎉 環境変数の設定が完了しました！');
  console.log('\n📌 次のステップ:');
  console.log('1. Vercelダッシュボードで新しいデプロイを確認');
  console.log('   https://vercel.com/webappai0410s-projects/rss-news-summarizer');
  console.log('\n2. デプロイ成功後、データベースを初期化:');
  console.log('   curl -X POST https://rss-news-summarizer-webappai0410s-projects.vercel.app/api/setup/database \\');
  console.log('     -H "Authorization: Bearer 11j2oKo+8IbSlkLMUN5kv9TCIXKi5JLAGNr11xTQVko="');
}

// 実行
setupAllEnvVars();