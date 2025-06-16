import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// For neon-serverless driver in edge runtime, use neon-http
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Export all schema types for convenience
export * from "./schema";