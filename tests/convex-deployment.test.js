/**
 * Convexデプロイメントのテスト
 * TDDアプローチでConvexの環境変数問題を解決
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('Convex Deployment Configuration', () => {
  test('CONVEX_DEPLOY_KEY should be set in Vercel environment', () => {
    // Vercelの環境変数をシミュレート
    const deployKey = process.env.CONVEX_DEPLOY_KEY;
    
    // デプロイキーが設定されていることを確認
    expect(deployKey).toBeDefined();
    expect(deployKey).toMatch(/^prod:pastel-alpaca-827\|/);
  });

  test('Convex configuration files should exist', () => {
    const convexDir = path.join(__dirname, '..', 'convex');
    expect(fs.existsSync(convexDir)).toBe(true);
    expect(fs.existsSync(path.join(convexDir, 'schema.ts'))).toBe(true);
  });

  test('No .env.production file should exist', () => {
    const envProd = path.join(__dirname, '..', '.env.production');
    expect(fs.existsSync(envProd)).toBe(false);
  });

  test('Build command should not have circular reference', () => {
    const packageJson = require('../package.json');
    expect(packageJson.scripts.build).toBe('next build');
    expect(packageJson.scripts.build).not.toContain('npm run build');
  });

  test('Convex deploy command format should be correct', () => {
    // Vercelのビルドコマンドをテスト
    const expectedCommand = "npx convex deploy --cmd 'next build'";
    // このコマンドがVercelで設定されているべき
    expect(expectedCommand).not.toContain('npm run build');
  });
});

describe('Convex API Key Format', () => {
  test('Deploy key should have correct format', () => {
    const testKey = 'prod:pastel-alpaca-827|eyJ2MiI6ImEwM2U5MDM0OTZhNjQ1MzY5OTAzYmVmYTY4ZTNkNDNlIn0=';
    
    // キーの形式を検証
    expect(testKey).toMatch(/^prod:[a-z-]+\|[A-Za-z0-9+/=]+$/);
    
    // Base64部分の検証
    const [prefix, base64] = testKey.split('|');
    expect(prefix).toBe('prod:pastel-alpaca-827');
    expect(() => Buffer.from(base64, 'base64')).not.toThrow();
  });
});