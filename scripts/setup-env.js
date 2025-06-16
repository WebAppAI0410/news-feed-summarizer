#!/usr/bin/env node

/**
 * 環境変数セットアップスクリプト
 * .env.localファイルとVercel環境変数を自動設定します
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 必要な環境変数のテンプレート
const envTemplate = {
  // Neon Database
  DATABASE_URL: '',
  NEON_API_KEY: 'napi_21drcda7lievuiwv1c69xjh96khu6wyxp6q02r4mo4bls86djf46o5wjyurpzwn8',
  
  // NextAuth
  NEXTAUTH_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  NEXTAUTH_SECRET: '',
  
  // OAuth providers (optional)
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  
  // OpenAI (for summarization)
  OPENAI_API_KEY: '',
  
  // Application settings
  NODE_ENV: 'development',
  NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
};

/**
 * ランダムなシークレットキーを生成
 */
function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * .env.localファイルを読み込む
 */
async function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  try {
    const content = await fs.readFile(envPath, 'utf-8');
    const env = {};
    
    content.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key) {
          let value = valueParts.join('=');
          // クォートを除去
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key.trim()] = value.trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    return {};
  }
}

/**
 * .env.localファイルに環境変数を書き込む
 */
async function writeEnvFile(envVars) {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = Object.entries(envVars)
    .map(([key, value]) => {
      // 値に改行やスペースが含まれる場合はクォートで囲む
      if (value && (value.includes(' ') || value.includes('\n'))) {
        return `${key}="${value}"`;
      }
      return `${key}=${value}`;
    })
    .join('\n');
  
  await fs.writeFile(envPath, content + '\n');
  console.log('✅ .env.localファイルが更新されました');
}

/**
 * Vercel CLIがインストールされているか確認
 */
async function checkVercelCli() {
  try {
    await execAsync('vercel --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Vercel環境変数を設定
 */
async function setVercelEnvVar(key, value, environment = ['development', 'preview', 'production']) {
  try {
    const envString = environment.join(' ');
    const command = `vercel env add ${key} ${envString}`;
    
    // 値を標準入力として渡す
    const child = require('child_process').spawn('vercel', ['env', 'add', key, ...environment], {
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: true
    });
    
    child.stdin.write(value + '\n');
    child.stdin.end();
    
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Vercel環境変数 ${key} が設定されました`);
          resolve();
        } else {
          reject(new Error(`Failed to set ${key}`));
        }
      });
    });
  } catch (error) {
    console.error(`❌ Vercel環境変数 ${key} の設定に失敗しました:`, error.message);
  }
}

/**
 * Vercelプロジェクトにリンクされているか確認
 */
async function checkVercelLink() {
  try {
    const { stdout } = await execAsync('vercel env ls', {
      cwd: path.join(__dirname, '..')
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🌟 環境変数セットアップを開始します...\n');
  
  try {
    // 1. 既存の環境変数を読み込む
    const existingEnv = await loadEnvFile();
    
    // 2. 環境変数を更新
    const updatedEnv = { ...envTemplate };
    
    // 既存の値を保持
    Object.keys(existingEnv).forEach(key => {
      if (existingEnv[key]) {
        updatedEnv[key] = existingEnv[key];
      }
    });
    
    // NEXTAUTH_SECRETが未設定の場合は生成
    if (!updatedEnv.NEXTAUTH_SECRET) {
      updatedEnv.NEXTAUTH_SECRET = generateSecret();
      console.log('🔐 NEXTAUTH_SECRETを生成しました');
    }
    
    // 3. .env.localファイルに書き込む
    await writeEnvFile(updatedEnv);
    
    // 4. Vercel環境変数の設定
    const hasVercelCli = await checkVercelCli();
    if (hasVercelCli) {
      console.log('\n🚀 Vercel環境変数を設定します...');
      
      const isLinked = await checkVercelLink();
      if (!isLinked) {
        console.log('⚠️  Vercelプロジェクトにリンクされていません');
        console.log('   以下のコマンドを実行してください: vercel link');
      } else {
        // 重要な環境変数をVercelに設定
        const vercelEnvVars = {
          DATABASE_URL: updatedEnv.DATABASE_URL,
          NEON_API_KEY: updatedEnv.NEON_API_KEY,
          NEXTAUTH_SECRET: updatedEnv.NEXTAUTH_SECRET,
          OPENAI_API_KEY: updatedEnv.OPENAI_API_KEY,
        };
        
        for (const [key, value] of Object.entries(vercelEnvVars)) {
          if (value) {
            await setVercelEnvVar(key, value);
          }
        }
      }
    } else {
      console.log('\n⚠️  Vercel CLIがインストールされていません');
      console.log('   Vercel環境変数を手動で設定してください');
    }
    
    console.log('\n🎉 環境変数のセットアップが完了しました！');
    console.log('\n📌 次のステップ:');
    console.log('   1. 必要に応じて.env.localファイルを編集');
    console.log('   2. OAuthプロバイダーの認証情報を設定');
    console.log('   3. OpenAI APIキーを設定（要約機能を使用する場合）');
    
  } catch (error) {
    console.error('\n❌ セットアップ中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプトを実行
if (require.main === module) {
  main();
}

module.exports = {
  generateSecret,
  loadEnvFile,
  writeEnvFile,
  setVercelEnvVar
};