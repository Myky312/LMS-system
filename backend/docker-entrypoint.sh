#!/bin/sh
set -e
if [ -n "$DATABASE_URL" ]; then
  pnpm exec drizzle-kit migrate --config=./drizzle.config.docker.cjs
fi
exec node dist/src/main.js
