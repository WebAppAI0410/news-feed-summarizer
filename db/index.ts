import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';

config({ path: ".env" }); // or .env.local

// For neon-http driver, pass the DATABASE_URL directly
export const db = drizzle(process.env.DATABASE_URL!);

// Export all schema types for convenience
export * from "./schema";