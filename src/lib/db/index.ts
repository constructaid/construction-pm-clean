/**
 * Database Connection for Neon PostgreSQL
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database URL from environment
const DATABASE_URL = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL connection
const queryClient = postgres(DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(queryClient, { schema });

// Export schema
export * from './schema';
