import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString: string | undefined = process.env.DATABASE_URL;
if (!connectionString) {
  const error = new Error('DATABASE_URL environment variable is required');
  throw error;
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
