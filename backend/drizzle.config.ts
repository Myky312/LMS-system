import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit config for migrations and studio.
 * - db:generate → writes SQL to src/database/migrations/
 * - db:migrate → runs pending migrations against DATABASE_URL
 * - db:push → dev-only direct sync (no history); avoid in production.
 */
export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/lms',
  },
});
