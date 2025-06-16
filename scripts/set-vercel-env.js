#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Vercel環境変数設定スクリプト');
console.log('=====================================\n');

// 必要な環境変数
const envVars = [
  {
    name: 'DATABASE_URL',
    description: 'Neon PostgreSQLの接続文字列',
    example: 'postgresql://username:password@ep-xxx.ap-northeast-1.aws.neon.tech/neondb?sslmode=require',
    required: true
  },
  {
    name: 'NEXTAUTH_URL',
    value: 'https://rss-news-summarizer-webappai0410s-projects.vercel.app',
    description: 'NextAuth.js用のアプリケーションURL'
  },
  {
    name: 'NEXTAUTH_SECRET',
    value: 'cBepd/dXQdUojFiPwB8CCrh6jweequN4/mrSKkT8cC8=',
    description: 'NextAuth.js用のシークレットキー'
  },
  {
    name: 'AUTH_TRUST_HOST',
    value: 'true',
    description: 'NextAuth.js用のホスト信頼設定'
  },
  {
    name: 'CRON_SECRET',
    value: '11j2oKo+8IbSlkLMUN5kv9TCIXKi5JLAGNr11xTQVko=',
    description: 'Cronジョブ認証用のシークレット'
  },
  {
    name: 'OPENAI_API_KEY',
    value: process.env.OPENAI_API_KEY || 'your-openai-api-key-here',
    description: 'OpenAI API キー（AI要約機能用）'
  }
];

async function setEnvironmentVariables() {
  const values = {};
  
  console.log('📋 環境変数の値を入力してください：\n');
  
  for (const envVar of envVars) {
    if (envVar.value) {
      // 既定値がある場合はそのまま使用
      values[envVar.name] = envVar.value;
      console.log(`✓ ${envVar.name}: [既定値を使用]`);
    } else {
      // ユーザー入力が必要
      const value = await new Promise((resolve) => {
        const prompt = `${envVar.name} (${envVar.description})\n例: ${envVar.example || ''}\n入力: `;
        rl.question(prompt, resolve);
      });
      
      if (!value && envVar.required) {
        console.error(`❌ ${envVar.name} は必須です。スクリプトを終了します。`);
        process.exit(1);
      }
      
      values[envVar.name] = value;
      console.log(`✓ ${envVar.name}: 設定完了\n`);
    }
  }
  
  rl.close();
  
  console.log('\n🔧 Vercel環境変数を設定中...\n');
  
  // Vercel CLIで環境変数を設定
  for (const [name, value] of Object.entries(values)) {
    if (value) {
      try {
        console.log(`Setting ${name}...`);
        execSync(`vercel env add ${name} production`, {
          input: `${value}\n`,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`✅ ${name} 設定完了`);
      } catch (error) {
        console.error(`❌ ${name} 設定失敗:`, error.message);
      }
    }
  }
  
  console.log('\n🎉 環境変数の設定が完了しました！');
  console.log('\n📌 次のステップ:');
  console.log('1. Vercelで新しいデプロイを確認');
  console.log('2. デプロイ成功後、データベースを初期化:');
  console.log('   curl -X POST https://rss-news-summarizer-webappai0410s-projects.vercel.app/api/setup/database \\');
  console.log('     -H "Authorization: Bearer 11j2oKo+8IbSlkLMUN5kv9TCIXKi5JLAGNr11xTQVko="');
}

// Vercel CLIのインストール確認
try {
  execSync('vercel --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Vercel CLIがインストールされていません。');
  console.log('以下のコマンドでインストールしてください:');
  console.log('npm install -g vercel');
  process.exit(1);
}

// Vercel認証の確認
try {
  execSync('vercel whoami', { stdio: 'pipe' });
  console.log('✅ Vercel認証済み\n');
  setEnvironmentVariables();
} catch (error) {
  console.error('❌ Vercel認証が必要です。');
  console.log('以下のコマンドで認証してください:');
  console.log('vercel login');
  console.log('\n認証後、再度このスクリプトを実行してください:');
  console.log('node scripts/set-vercel-env.js');
  process.exit(1);
}