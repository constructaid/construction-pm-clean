/**
 * Database Connection for Neon PostgreSQL
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment
// Handle both Astro (import.meta.env) and Node (process.env) contexts
const DATABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.DATABASE_URL) ||
  process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL connection
const queryClient = postgres(DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(queryClient, { schema });

// Export schema
export * from './schema';
