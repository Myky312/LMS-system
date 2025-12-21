/**
 * E2E Test Setup
 * 
 * This file runs before all E2E tests
 * - Sets up test environment variables
 * - Validates test database connection
 */

// Load test environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test if it exists
config({ path: resolve(__dirname, '../.env.test') });

// Validate required test environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Missing required test environment variable: ${envVar}. Create .env.test file.`,
    );
  }
}

// Ensure we're using test database
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('test')) {
  console.warn(
    'WARNING: DATABASE_URL does not contain "test". Make sure you are using test database!',
  );
}

