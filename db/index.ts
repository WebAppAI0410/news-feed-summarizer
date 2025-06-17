// Database connection - simplified for debugging
let db: any;

try {
  // Try to import drizzle-orm/neon-http
  const drizzleModule = require('drizzle-orm/neon-http');
  if (drizzleModule && drizzleModule.drizzle) {
    db = drizzleModule.drizzle(process.env.DATABASE_URL!);
  } else {
    // Fallback if drizzle is not available
    console.error('drizzle-orm/neon-http does not export drizzle function');
    db = {}; // Mock db object for build
  }
} catch (error) {
  console.error('Failed to import drizzle-orm/neon-http:', error);
  db = {}; // Mock db object for build
}

export { db };
export * from './schema';