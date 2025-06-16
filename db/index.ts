import { config } from "dotenv";

config({ path: ".env" }); // or .env.local

// Temporary workaround for build issue
let db: any;

if (process.env.NODE_ENV === 'production') {
  // Production uses edge runtime compatible driver
  const { neon } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-serverless');
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzle(sql);
} else {
  // Development can use HTTP driver
  const { drizzle } = require('drizzle-orm/neon-http');
  db = drizzle(process.env.DATABASE_URL!);
}

export { db };

// Export all schema types for convenience
export * from "./schema";