import { config } from "dotenv";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

config({ path: ".env" }); // or .env.local

// For neon-serverless driver, use neon client
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Export all schema types for convenience
export * from "./schema";