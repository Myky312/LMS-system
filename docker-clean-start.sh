#!/usr/bin/env sh
# Clean start: remove all containers and volumes, then start the stack (including db-studio).
# Run from repo root: ./docker-clean-start.sh

set -e
cd "$(dirname "$0")"

echo "Stopping and removing containers, networks, volumes..."
docker compose down -v

echo "Removing any orphan/run containers (e.g. old db-studio run)..."
docker container prune -f

echo "Starting all services (postgres, minio, backend, prometheus, grafana, db-studio)..."
docker compose up -d

echo "Done. Wait ~15s for backend and db-studio to be ready."
echo "  Backend:    http://localhost:3000/api/v1"
echo "  Swagger:    http://localhost:3000/api/docs#"
echo "  MinIO:      http://localhost:9001 (admin/minioadmin)"
echo "  Grafana:    http://localhost:3001 (admin/admin)"
echo "  Drizzle:    https://local.drizzle.studio (allow Local network access)"
