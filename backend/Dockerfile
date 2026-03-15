# -----------------------------------------------------------------------------
# Builder: install all deps, compile TypeScript. No dev deps in final image.
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Use pnpm (match engines: >=8 <9). Corepack is built into Node 20.
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# -----------------------------------------------------------------------------
# Production: only runtime deps + dist. Non-root user. Minimal surface.
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Production dependencies only (no devDependencies)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Compiled output from builder
COPY --from=builder /app/dist ./dist
# Migrations and Drizzle config (needed for db:migrate on startup)
COPY --from=builder /app/src/database/migrations ./src/database/migrations
COPY --from=builder /app/drizzle.config.docker.cjs ./

# Entrypoint: run migrations then start the app
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Run as non-root. node user exists in official Node image.
RUN chown -R node:node /app
USER node

EXPOSE 3000

# Healthcheck: tie to existing /api/v1/health (readiness)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
