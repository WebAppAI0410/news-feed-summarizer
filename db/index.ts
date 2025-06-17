// Database connection for Vercel Edge Runtime
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

export const db = drizzle(process.env.DATABASE_URL!, { schema });

// Export all schema types for convenience
export * from "./schema";