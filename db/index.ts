// This file conditionally exports the correct database instance
// based on the runtime environment

// For server-side code (API routes, SSR)
export * from './index-node';

// Re-export schema for convenience
export * from "./schema";