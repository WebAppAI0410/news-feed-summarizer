#!/usr/bin/env node

/**
 * 統合セットアップスクリプト
 * プロジェクトの初期セットアップをすべて自動化します
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

// セットアップステップの定義
const setupSteps = [
  {
    name: '依存関係のインストール',
    command: 'npm install',
    description: 'プロジェクトの依存関係をインストールしています...'
  },
  {
    name: '環境変数の設定',
    command: 'node scripts/setup-env.js',
    description: '環境変数を設定しています...'
  },
  {
    name: 'Neonデータベースのセットアップ',
    command: 'node scripts/neon-setup.js',
    description: 'Neonデータベースを設定しています...'
  },
  {
    name: 'データベースの初期化',
    command: 'npm run db:seed',
    description: '初期データを投入しています...',
    optional: true
  },
  {
    name: '型チェック',
    command: 'npm run typecheck',
    description: 'TypeScriptの型チェックを実行しています...',
    optional: true
  }
];

/**
 * コマンドを実行してログを表示
 */
async function runCommand(command, cwd) {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * プログレスバーを表示
 */
function showProgress(current, total, stepName) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  console.log(`\n[${bar}] ${percentage}% - ${stepName}`);
}

/**
 * セットアップの前提条件をチェック
 */
async function checkPrerequisites() {
  console.log('📋 前提条件をチェックしています...\n');
  
  const checks = [
    {
      name: 'Node.js',
      command: 'node --version',
      minVersion: '18.0.0'
    },
    {
      name: 'npm',
      command: 'npm --version',
      minVersion: '8.0.0'
    }
  ];
  
  for (const check of checks) {
    try {
      const { stdout } = await execAsync(check.command);
      console.log(`✅ ${check.name}: ${stdout.trim()}`);
    } catch (error) {
      console.error(`❌ ${check.name}が見つかりません`);
      return false;
    }
  }
  
  return true;
}

/**
 * セットアップ完了後の情報を表示
 */
async function showCompletionInfo() {
  console.log('\n' + '='.repeat(50));
  console.log('🎉 セットアップが完了しました！');
  console.log('='.repeat(50) + '\n');
  
  console.log('📌 次のステップ:');
  console.log('');
  console.log('1. 環境変数を確認・設定:');
  console.log('   - .env.localファイルを編集');
  console.log('   - OpenAI APIキーを設定（要約機能用）');
  console.log('   - OAuth認証情報を設定（Google認証用）');
  console.log('');
  console.log('2. 開発サーバーを起動:');
  console.log('   npm run dev');
  console.log('');
  console.log('3. データベース管理:');
  console.log('   - Drizzle Studio: npm run db:studio');
  console.log('   - スキーマ変更: npm run db:push');
  console.log('');
  console.log('4. テストの実行:');
  console.log('   - ユニットテスト: npm test');
  console.log('   - E2Eテスト: npm run test:e2e');
  console.log('');
  console.log('📚 ドキュメント:');
  console.log('   - README.md: プロジェクト概要');
  console.log('   - SETUP.md: セットアップ手順');
  console.log('   - DEPLOYMENT.md: デプロイ手順');
  console.log('');
  console.log('🔗 便利なリンク:');
  console.log('   - Neon Console: https://console.neon.tech');
  console.log('   - Vercel Dashboard: https://vercel.com/dashboard');
  console.log('   - NextAuth.js Docs: https://next-auth.js.org');
}

/**
 * エラーリカバリーの提案を表示
 */
function showErrorRecovery(stepName, error) {
  console.error(`\n❌ "${stepName}" でエラーが発生しました`);
  console.error(`エラー: ${error}`);
  console.log('\n💡 解決方法:');
  
  switch (stepName) {
    case '依存関係のインストール':
      console.log('   - node_modulesフォルダを削除: rm -rf node_modules');
      console.log('   - package-lock.jsonを削除: rm package-lock.json');
      console.log('   - 再度インストール: npm install');
      break;
    case '環境変数の設定':
      console.log('   - .env.localファイルを手動で作成');
      console.log('   - .env.exampleを参考に必要な変数を設定');
      break;
    case 'Neonデータベースのセットアップ':
      console.log('   - Neon APIキーが正しいか確認');
      console.log('   - Neonコンソールでプロジェクトを手動作成');
      console.log('   - DATABASE_URLを.env.localに設定');
      break;
    case 'データベースの初期化':
      console.log('   - データベース接続を確認: npm run db:studio');
      console.log('   - スキーマを適用: npm run db:push');
      console.log('   - 再度シード実行: npm run db:seed');
      break;
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('🚀 RSS News Summarizer セットアップを開始します');
  console.log('='.repeat(50) + '\n');
  
  const projectRoot = path.join(__dirname, '..');
  
  // 前提条件をチェック
  const prerequisitesMet = await checkPrerequisites();
  if (!prerequisitesMet) {
    console.error('\n❌ 前提条件を満たしていません。必要なツールをインストールしてください。');
    process.exit(1);
  }
  
  console.log('\n✅ すべての前提条件を満たしています\n');
  console.log('セットアップを開始します...\n');
  
  let completedSteps = 0;
  const totalSteps = setupSteps.filter(step => !step.optional).length;
  
  for (const step of setupSteps) {
    showProgress(completedSteps, totalSteps, step.name);
    console.log(`📦 ${step.description}`);
    
    const result = await runCommand(step.command, projectRoot);
    
    if (result.success) {
      console.log(`✅ ${step.name} が完了しました`);
      if (!step.optional) {
        completedSteps++;
      }
    } else {
      if (step.optional) {
        console.warn(`⚠️  ${step.name} をスキップしました（オプション）`);
      } else {
        showErrorRecovery(step.name, result.error);
        console.error('\n❌ セットアップを中断しました');
        process.exit(1);
      }
    }
  }
  
  showProgress(totalSteps, totalSteps, '完了');
  await showCompletionInfo();
}

// スクリプトを実行
if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ 予期しないエラーが発生しました:', error.message);
    process.exit(1);
  });
}

module.exports = { main, runCommand, checkPrerequisites };