#!/usr/bin/env node

// デプロイ時の環境変数をデバッグするスクリプト
console.log('=== Convex Deploy Debug Info ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CONVEX_DEPLOY_KEY exists:', !!process.env.CONVEX_DEPLOY_KEY);
console.log('CONVEX_DEPLOY_KEY length:', process.env.CONVEX_DEPLOY_KEY?.length || 0);
console.log('CONVEX_DEPLOY_KEY prefix:', process.env.CONVEX_DEPLOY_KEY?.substring(0, 10) + '...');
console.log('NEXT_PUBLIC_CONVEX_URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
console.log('All env keys:', Object.keys(process.env).filter(key => key.includes('CONVEX')).join(', '));
console.log('================================');

// Convex deployを実行
const { execSync } = require('child_process');
try {
  execSync('npx convex deploy --cmd "next build"', { stdio: 'inherit' });
} catch (error) {
  console.error('Deploy failed');
  process.exit(1);
}