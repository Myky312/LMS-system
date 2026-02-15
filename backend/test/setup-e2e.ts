/**
 * E2E Test Setup
 *
 * Runs before all E2E tests:
 * - Loads .env and requires TEST_DATABASE_URL (separate DB, same schema as app)
 * - Switches DATABASE_URL to test DB so the app and Drizzle use it during tests
 * - Runs migrations on test DB so its schema matches the app DB exactly
 */
process.env.DOTENV_CONFIG_SUPPRESS_LOGS = 'true';

import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

config({ path: resolve(__dirname, '../.env') });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is not set in .env. ' +
      'Set it to a separate test database (e.g. baitulquran_test); it will be synced to app schema before each test run.',
  );
}

process.env.DATABASE_URL = testDatabaseUrl;

const requiredEnvVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required test env: ${envVar}`);
  }
}

// Sync test DB to app schema before every test run (same migrations as app DB)
const backendDir = resolve(__dirname, '..');
try {
  execSync('pnpm run db:migrate', {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: 'pipe',
  });
} catch {
  throw new Error(
    'Failed to run migrations on test database. ' +
      'Ensure PostgreSQL is running and baitulquran_test exists. ' +
      'Create it if needed: createdb -U baitul_user baitulquran_test',
  );
}
