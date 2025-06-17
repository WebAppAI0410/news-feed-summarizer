console.log('Testing build environment...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL value:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');

// Test if we can require basic modules
try {
  require('next');
  console.log('✓ next is available');
} catch (e) {
  console.log('✗ next is NOT available');
}

try {
  require('drizzle-orm');
  console.log('✓ drizzle-orm is available');
} catch (e) {
  console.log('✗ drizzle-orm is NOT available');
}

try {
  require('@neondatabase/serverless');
  console.log('✓ @neondatabase/serverless is available');
} catch (e) {
  console.log('✗ @neondatabase/serverless is NOT available');
}

// Test the actual import that's failing
try {
  const { drizzle } = require('drizzle-orm/neon-http');
  console.log('✓ drizzle-orm/neon-http import works');
} catch (e) {
  console.log('✗ drizzle-orm/neon-http import FAILS:', e.message);
}

console.log('\nBuild test complete.');