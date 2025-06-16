#!/usr/bin/env node

/**
 * Neon Database Setup Script
 * このスクリプトはNeon APIを使用してデータベースの設定と管理を行います
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Neon API設定
const NEON_API_KEY = process.env.NEON_API_KEY || 'napi_21drcda7lievuiwv1c69xjh96khu6wyxp6q02r4mo4bls86djf46o5wjyurpzwn8';
const NEON_API_HOST = 'console.neon.tech';

/**
 * Neon APIリクエストを送信する関数
 */
async function neonApiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: NEON_API_HOST,
      path: `/api/v2${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${NEON_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * プロジェクト一覧を取得
 */
async function listProjects() {
  try {
    console.log('📋 プロジェクト一覧を取得中...');
    const response = await neonApiRequest('GET', '/projects');
    return response.projects || [];
  } catch (error) {
    console.error('❌ プロジェクト一覧の取得に失敗しました:', error.message);
    return [];
  }
}

/**
 * プロジェクトを作成
 */
async function createProject(name) {
  try {
    console.log(`🚀 プロジェクト "${name}" を作成中...`);
    const response = await neonApiRequest('POST', '/projects', {
      project: {
        name,
        region_id: 'aws-ap-northeast-1' // 東京リージョン
      }
    });
    console.log(`✅ プロジェクトが作成されました: ${response.project.id}`);
    return response.project;
  } catch (error) {
    console.error('❌ プロジェクトの作成に失敗しました:', error.message);
    throw error;
  }
}

/**
 * データベース接続情報を取得
 */
async function getDatabaseConnectionString(projectId) {
  try {
    console.log('🔗 データベース接続情報を取得中...');
    const response = await neonApiRequest('GET', `/projects/${projectId}/connection_uri`);
    return response.uri;
  } catch (error) {
    console.error('❌ 接続情報の取得に失敗しました:', error.message);
    throw error;
  }
}

/**
 * ブランチ一覧を取得
 */
async function listBranches(projectId) {
  try {
    const response = await neonApiRequest('GET', `/projects/${projectId}/branches`);
    return response.branches || [];
  } catch (error) {
    console.error('❌ ブランチ一覧の取得に失敗しました:', error.message);
    return [];
  }
}

/**
 * データベースを取得
 */
async function getDatabases(projectId, branchId) {
  try {
    const response = await neonApiRequest('GET', `/projects/${projectId}/branches/${branchId}/databases`);
    return response.databases || [];
  } catch (error) {
    console.error('❌ データベース一覧の取得に失敗しました:', error.message);
    return [];
  }
}

/**
 * 環境変数を.env.localファイルに書き込む
 */
async function updateEnvFile(connectionString) {
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';

  try {
    envContent = await fs.readFile(envPath, 'utf-8');
  } catch (error) {
    // ファイルが存在しない場合は新規作成
    console.log('📝 .env.localファイルを新規作成します...');
  }

  // DATABASE_URLを更新または追加
  const databaseUrlRegex = /^DATABASE_URL=.*$/m;
  const neonApiKeyRegex = /^NEON_API_KEY=.*$/m;

  if (databaseUrlRegex.test(envContent)) {
    envContent = envContent.replace(databaseUrlRegex, `DATABASE_URL="${connectionString}"`);
  } else {
    envContent += `\n# Neon Database\nDATABASE_URL="${connectionString}"\n`;
  }

  if (neonApiKeyRegex.test(envContent)) {
    envContent = envContent.replace(neonApiKeyRegex, `NEON_API_KEY="${NEON_API_KEY}"`);
  } else {
    envContent += `NEON_API_KEY="${NEON_API_KEY}"\n`;
  }

  await fs.writeFile(envPath, envContent);
  console.log('✅ .env.localファイルが更新されました');
}

/**
 * スキーマを適用
 */
async function applySchema() {
  try {
    console.log('🔨 データベーススキーマを適用中...');
    
    // Drizzleのpushコマンドを実行
    const { stdout, stderr } = await execAsync('npm run db:push', {
      cwd: path.join(__dirname, '..')
    });

    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️ 警告:', stderr);
    }

    console.log('✅ スキーマが適用されました');
    if (stdout) {
      console.log(stdout);
    }
  } catch (error) {
    console.error('❌ スキーマの適用に失敗しました:', error.message);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🌟 Neon Database セットアップを開始します...\n');

  try {
    // 1. プロジェクト一覧を取得
    const projects = await listProjects();
    
    let project;
    if (projects.length === 0) {
      // プロジェクトがない場合は新規作成
      project = await createProject('rss-news-summarizer');
    } else {
      // 既存のプロジェクトを使用
      project = projects[0];
      console.log(`📦 既存のプロジェクトを使用: ${project.name} (${project.id})`);
    }

    // 2. ブランチ情報を取得
    const branches = await listBranches(project.id);
    const mainBranch = branches.find(b => b.name === 'main') || branches[0];
    
    if (!mainBranch) {
      throw new Error('メインブランチが見つかりません');
    }

    // 3. データベース情報を取得
    const databases = await getDatabases(project.id, mainBranch.id);
    const database = databases.find(db => db.name === 'neondb') || databases[0];
    
    if (!database) {
      throw new Error('データベースが見つかりません');
    }

    // 4. 接続文字列を取得
    const connectionString = await getDatabaseConnectionString(project.id);
    console.log('✅ 接続文字列を取得しました');

    // 5. 環境変数を更新
    await updateEnvFile(connectionString);

    // 6. スキーマを適用
    await applySchema();

    console.log('\n🎉 Neon Database のセットアップが完了しました！');
    console.log('\n📌 次のステップ:');
    console.log('   1. npm run dev でアプリケーションを起動');
    console.log('   2. データベースの初期データを投入: npm run db:seed');

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
  neonApiRequest,
  listProjects,
  createProject,
  getDatabaseConnectionString,
  updateEnvFile,
  applySchema
};