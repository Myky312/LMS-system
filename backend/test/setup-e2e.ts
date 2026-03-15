/**
 * E2E Test Setup
 *
 * Runs before all E2E tests:
 * - Loads .env and requires TEST_DATABASE_URL (separate DB)
 * - Switches DATABASE_URL to test DB so the app and Drizzle use it during tests
 * - Applies the same migrations as the main DB (schema + seed) so test DB is identical
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
      'Set it to a separate test database (e.g. zeekracademy_test); it will be synced to app schema before each test run.',
  );
}

process.env.DATABASE_URL = testDatabaseUrl;

// Use separate S3 bucket for tests (no cross-contamination with dev/prod)
if (process.env.NODE_ENV === 'test' && process.env.S3_BUCKET_TEST) {
  process.env.S3_BUCKET = process.env.S3_BUCKET_TEST;
}

const requiredEnvVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required test env: ${envVar}`);
  }
}

// Apply the same migrations as main DB (schema + seed) so test DB has identical structure and seed data
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
      'Ensure PostgreSQL is running and the test DB exists (e.g. zeekracademy_test). ' +
      'Create it if needed: createdb -U zeekr_user zeekracademy_test',
  );
}
