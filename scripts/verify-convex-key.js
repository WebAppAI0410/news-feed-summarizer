#!/usr/bin/env node

/**
 * Convexデプロイキーの検証スクリプト
 * 環境変数とキーの形式を検証
 */

const https = require('https');

// 提供されたデプロイキー
const providedKeys = [
  'prod:pastel-alpaca-827|eyJ2MiI6IjgzNDg0ZDBhNzdjOTQ4Zjk5OWYyZDFjOTAzNjZmM2ZjIn0=',
  'prod:pastel-alpaca-827|eyJ2MiI6ImEwM2U5MDM0OTZhNjQ1MzY5OTAzYmVmYTY4ZTNkNDNlIn0='
];

console.log('=== Convex Deploy Key Verification ===\n');

// 環境変数の確認
console.log('1. Environment Variables:');
console.log('   CONVEX_DEPLOY_KEY exists:', !!process.env.CONVEX_DEPLOY_KEY);
console.log('   CONVEX_DEPLOYMENT:', process.env.CONVEX_DEPLOYMENT);
console.log('   NEXT_PUBLIC_CONVEX_URL:', process.env.NEXT_PUBLIC_CONVEX_URL);

// キーのフォーマット検証
console.log('\n2. Key Format Validation:');
providedKeys.forEach((key, index) => {
  console.log(`\n   Key ${index + 1}:`);
  const [prefix, token] = key.split('|');
  console.log(`   - Prefix: ${prefix}`);
  console.log(`   - Token length: ${token.length}`);
  
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    console.log(`   - Decoded: ${JSON.stringify(parsed)}`);
    console.log(`   - Valid format: ✓`);
  } catch (e) {
    console.log(`   - Valid format: ✗ (${e.message})`);
  }
});

// Convex APIテスト
console.log('\n3. Testing Convex API Connection:');

async function testConvexAPI(deployKey) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ deployKey });
    
    const options = {
      hostname: 'api.convex.dev',
      port: 443,
      path: '/api/deployment/url_for_key',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        if (res.statusCode !== 200) {
          console.log(`   Response: ${data}`);
        } else {
          console.log(`   Success: Deployment URL retrieved`);
        }
        resolve(res.statusCode);
      });
    });

    req.on('error', (e) => {
      console.error(`   Error: ${e.message}`);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// 各キーをテスト
(async () => {
  for (let i = 0; i < providedKeys.length; i++) {
    console.log(`\n   Testing Key ${i + 1}...`);
    await testConvexAPI(providedKeys[i]);
  }
  
  console.log('\n=== Verification Complete ===');
})();