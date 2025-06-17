// Database connection for Vercel Edge Runtime
import { drizzle } from 'drizzle-orm/neon-serverless';

export const db = drizzle(process.env.DATABASE_URL!);

// Export all schema types for convenience
export * from "./schema";