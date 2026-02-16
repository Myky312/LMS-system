# BaitulQuran

Learning Management System (LMS) for structured Islamic education: courses, modules, lessons, and tasks (quiz, audio, photo) with teacher/student roles, submissions, and media via S3.

- **Backend**: NestJS, Drizzle, PostgreSQL, JWT, S3-compatible storage. API at `api/v1`, Swagger at `/api/docs`, health and Prometheus metrics included.  
  → Full backend docs: [backend/README.md](backend/README.md)

- **Run everything in Docker**: Postgres, Backend, MinIO, Prometheus, Grafana. See [Run with Docker](#run-with-docker) below.

---

## Run with Docker

Deterministic steps to bring up and verify the full stack (Postgres, Backend, MinIO, Prometheus, Grafana).

**All commands from project root** (where `docker-compose.yml` lives).

### STEP 0 — Pre-Flight Checklist

1. **Ensure `backend/.env.docker` exists**
   ```bash
   [ -f backend/.env.docker ] || cp backend/.env.docker.example backend/.env.docker
   ```

2. **Edit `backend/.env.docker`** and set (do not leave blank):
   - `JWT_ACCESS_SECRET=supersecret`
   - `JWT_REFRESH_SECRET=supersecret`
   - `S3_ACCESS_KEY=minioadmin`
   - `S3_SECRET_KEY=minioadmin`

3. **Free port 3000**  
   If you run the backend locally, stop it before starting the Docker backend. Otherwise the backend container will stay in "Created" (port bind failure).
   ```bash
   # See what is using 3000
   lsof -i :3000
   # Stop local backend or that process, then start container:
   docker start baitul-backend
   ```

### STEP 1 — Clean Start

```bash
docker compose down -v
```

Removes containers, networks, and **volumes** (including Postgres data). Fresh state.

### STEP 2 — Build and Start

```bash
docker compose up --build
```

Or detached:

```bash
docker compose up --build -d
```

**Expected:** Postgres → healthcheck passes → Backend builds and starts (after Postgres healthy) → MinIO, Prometheus, Grafana start.

If the backend container does not start (status **Created**), port 3000 is likely in use. Stop whatever is on 3000 and run:

```bash
docker start baitul-backend
```

If backend crashes, read logs:

```bash
docker logs baitul-backend
```

### STEP 3 — Verify Backend (Before Grafana)

**Liveness**

```bash
curl http://localhost:3000/api/v1/health
```

Expected: `{"status":"ok",...}` or similar.

**Readiness (DB)**

```bash
curl http://localhost:3000/api/v1/health/ready
```

If DB is connected: success. If it fails, check `DATABASE_URL` in `docker-compose.yml` and backend env.

**Metrics**

```bash
curl http://localhost:3000/api/v1/metrics
```

Expected: Prometheus text with `# HELP http_requests_total`, `# TYPE http_requests_total counter`, etc.

### STEP 4 — Verify Prometheus

1. Open **http://localhost:9090**
2. Go to **Status → Targets**
3. **backend** should be **UP**

If **DOWN**: wrong metrics path, backend not reachable (e.g. backend container not running), or wrong port. Metrics path must be `/api/v1/metrics`, target `backend:3000`.

### STEP 5 — Verify Metrics in Prometheus

In Prometheus UI:

- Query: `http_requests_total` → Execute. After hitting endpoints, values > 0.
- Query: `http_request_duration_seconds_bucket` → histogram buckets.

### STEP 6 — Setup Grafana

1. Open **http://localhost:3001**
2. Login: **admin** / **admin** (change password when prompted)
3. **Add Prometheus data source**
   - ⚙️ **Connections** → **Data sources** → **Add data source** → **Prometheus**
   - URL: **`http://prometheus:9090`** (use service name, **not** localhost)
   - **Save & test** → "Data source is working"

### STEP 7 — Basic Dashboard

- **Create** → **Dashboard** → **Add** panel.

**Request rate**

- Query: `rate(http_requests_total[1m])`
- Visualization: **Time series**

**P95 latency**

- Query:
  ```promql
  histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
  ```
- Visualization: **Time series**

Generate traffic to see movement:

```bash
for i in {1..50}; do curl -s http://localhost:3000/api/v1/health > /dev/null; done
```

Watch the Grafana graph; if it moves, the pipeline is wired correctly.

### Final Sanity Check

```bash
docker ps
```

Expected containers (all running):

- **baitul-backend**
- **baitul-postgres**
- **baitul-minio**
- **baitul-prometheus**
- **baitul-grafana**

### If Something Breaks

| Symptom | Likely cause |
|--------|----------------|
| Prometheus target **DOWN** | Wrong metrics path, backend not running, or wrong host/port (use `backend:3000`, path `/api/v1/metrics`) |
| Grafana "cannot connect" to Prometheus | Using `localhost` instead of **`http://prometheus:9090`**; or Prometheus container not running |
| Backend cannot connect to Postgres | Wrong `DATABASE_URL` or Postgres not healthy before backend starts |

When asking for help, paste **logs** (e.g. `docker logs baitul-backend`), not guesses.
