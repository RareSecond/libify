import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import { DB } from './types';

// Create the database instance
export function createKyselyDatabase(connectionString: string): Kysely<DB> {
  const pool = new Pool({
    connectionString,
  });

  const dialect = new PostgresDialect({
    pool,
  });

  return new Kysely<DB>({
    dialect,
  });
}

// Helper function to get database URL from environment
export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return databaseUrl;
}
