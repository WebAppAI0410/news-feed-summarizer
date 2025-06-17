// Database connection for Vercel Edge Runtime
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

// Export all schema types for convenience
export * from "./schema";