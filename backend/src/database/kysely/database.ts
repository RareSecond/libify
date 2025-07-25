import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import postgres from 'postgres';

import { DB } from './types';

// Create the database instance
export function createKyselyDatabase(connectionString: string): Kysely<DB> {
  const sql = postgres(connectionString);

  const dialect = new PostgresJSDialect({
    postgres: sql,
  });

  return new Kysely<DB>({
    dialect,
    log(event) {
      if (event.level === 'query' && process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Query:', event.query.sql);
        // eslint-disable-next-line no-console
        console.log('Parameters:', event.query.parameters);
      }
    },
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
