// Drizzle config for running migrations inside Docker (no TypeScript).
// Used by Docker entrypoint: pnpm exec drizzle-kit migrate --config=./drizzle.config.docker.cjs

module.exports = {
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/lms',
  },
};
