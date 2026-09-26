# KisanSetu Production Deployment & Infrastructure Guide

This guide describes how to deploy and operate the KisanSetu application in local containerized development, staging, and cloud production environments.

---

## 1. System Architecture

```
Internet / End Users (Farmers, Mandi Officers, Administrators)
                        │ HTTPS (Port 443 / 80)
                        ▼
       ┌─────────────────────────────────┐
       │     Nginx Web Server / SPA      │
       │    (Static Assets + Cache)      │
       └────────────────┬────────────────┘
                        │ Reverse Proxy /api/ & /health/
                        ▼
       ┌─────────────────────────────────┐
       │   KisanSetu Express Backend     │
       │  (Controller / Service / Repo)  │
       └────────────────┬────────────────┘
                        │ Connection Pool (PrismaPg)
                        ▼
       ┌─────────────────────────────────┐
       │    PostgreSQL Database 16       │
       │    (Persistent Data Volume)     │
       └─────────────────────────────────┘
```

---

## 2. Local Docker Compose Setup

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+
- Ports available: `80` (or configured via compose), `3001` (backend), `5432` (PostgreSQL)

### Starting the Stack
To build images and launch the complete stack with persistent storage:

```bash
docker compose up --build -d
```

### Checking Container Health
```bash
docker compose ps
```

All three services will show healthy status:
- `kisansetu-postgres`: `healthy` (via `pg_isready -U postgres -d kisansetu`)
- `kisansetu-backend`: `healthy` (via `GET /health/live`)
- `kisansetu-frontend`: `healthy` (via `GET /nginx-health`)

### Stopping the Stack
```bash
# Gracefully stop containers without destroying persistent data:
docker compose down

# To also wipe database volumes (destructive):
docker compose down -v
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the root and configure for your environment:

| Variable | Type | Allowed Values / Format | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | String | `development` \| `staging` \| `production` \| `test` | Runtime environment. Enforces strict secret checks when set to `production`. |
| `PORT` | Number | `3001` | TCP port the Express server listens on. |
| `DATABASE_URL` | String | `postgresql://user:pass@host:5432/db?schema=public` | Connection URI for PostgreSQL database. |
| `JWT_SECRET` | String | Min 32 random characters | HMAC secret key used for signing session JWTs. |
| `ALLOWED_ORIGINS` | String | Comma-separated URLs | Allowed origins for CORS (e.g. `http://localhost,http://localhost:80`). |
| `FRONTEND_URL` | String | URL | Base URL of the frontend application. |
| `DEMO_MODE` | Boolean | `true` \| `false` | Enables/disables 1-click Quick Demo logins and automated presentation routes. |
| `LOG_LEVEL` | String | `info` \| `debug` \| `warn` \| `error` | Minimum logging level for Pino. |
| `RATE_LIMIT_WINDOW_MS`| Number | `900000` (15 mins) | Time window in milliseconds for rate limiting. |
| `RATE_LIMIT_MAX_AUTH` | Number | `30` | Maximum login/registration attempts allowed per IP per window. |
| `RATE_LIMIT_MAX_GENERAL`| Number | `600` | Maximum general API requests allowed per IP per window. |

---

## 4. Database Setup & Persistence

The KisanSetu database schema is managed via **Prisma ORM**.
- **Container Volume:** Defined as `pgdata_volume` in `docker-compose.yml` mapped to `/var/lib/postgresql/data`. Data survives container restarts and image updates.
- **Embedded Local Mode:** When `DATABASE_URL` is pointed to localhost without Docker, KisanSetu automatically utilizes zero-config embedded persistence in `./backend/pgdata`.

---

## 5. Prisma Migration Process

Database migrations must never be performed using development database reset commands in production.

### Production Migration Command:
```bash
cd backend
npm run db:migrate:prod
# Directly runs: npx prisma migrate deploy
```

`prisma migrate deploy` applies any pending migrations safely in order without wiping existing data or dropping tables.

---

## 6. Production Startup Sequence

The recommended production container / CI sequence:
1. **Container Build:** Build backend and frontend multi-stage container images.
2. **Database Provisioning:** Ensure managed PostgreSQL (AWS RDS / Neon / Supabase) is running and reachable.
3. **Migration Execution:** Run `npm run db:migrate:prod` in a one-off task/job.
4. **Backend Launch:** Start backend containers with `NODE_ENV=production` and valid `JWT_SECRET`.
5. **Readiness Verification:** Kubernetes / load balancer probes `/health/ready`.
6. **Traffic Ingress:** Point reverse proxy / CDN / Nginx to healthy backend instances.

---

## 7. Health Endpoints & Probes

| Endpoint | HTTP Method | Auth Required | Purpose | Response |
| :--- | :---: | :---: | :--- | :--- |
| `/health/live` | `GET` | No | Liveness probe: verifies Node event loop is active. | `{"status": "ok"}` (HTTP 200) |
| `/health/ready` | `GET` | No | Readiness probe: executes `SELECT 1;` against PostgreSQL. | `{"status": "ready"}` (HTTP 200) or `{"status": "unhealthy"}` (HTTP 503) |
| `/api/health` | `GET` | No | Legacy API status probe for client monitoring. | Metadata JSON with timestamp and version. |

---

## 8. Structured Logging & Privacy

- Powered by **Pino** and **Pino-HTTP**.
- Output: Standard JSON lines formatted for log ingestion systems (CloudWatch, Datadog, Grafana Loki).
- **Privacy Redaction:** Sensitive fields are automatically masked with `[REDACTED]`:
  - `req.headers.authorization`
  - `req.headers.cookie`
  - `password`, `*.password`
  - `token`, `*.token`
  - `aadhaar`, `*.aadhaar`
  - `bankAccount`, `*.bankAccount`

---

## 9. Request Correlation IDs

- Every incoming HTTP request is correlated via header `x-request-id`.
- If the client (browser, mobile app, or API gateway) provides `x-request-id`, it is sanitized and reused.
- If missing, a standard RFC4122 UUIDv4 is generated.
- The ID is:
  1. Attached to `req.id`
  2. Injected into every structured log line (`requestId`)
  3. Returned in the response header `x-request-id`

---

## 10. Security Considerations

- **Helmet:** Enforces security headers on every response (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- **Rate Limiting:** Protects `/api/auth/login` and `/api/auth/register` against brute-force attacks.
- **Error Sanitization:** In `NODE_ENV=production`, stack traces, SQL syntax, and file paths are never returned to clients.
- **Non-Root Containers:** Backend runs as unprivileged user `nodejs` (UID 1001).

---

## 11. Demo Mode Isolation

- Set `DEMO_MODE=false` in production.
- When `DEMO_MODE=false`:
  - `/api/demo/*` routes return HTTP 403 Forbidden.
  - Demo seeding scripts are never automatically triggered.
  - UI 1-click Quick Demo login shortcuts are disabled.

---

## 12. Backup Considerations

For production deployments:
1. **Automated Daily Snapshots:** Utilize cloud provider automated volume snapshots (e.g. AWS RDS 7-day retention).
2. **Logical Dumps:** Run scheduled `pg_dump`:
   ```bash
   pg_dump -U postgres -h db-host -d kisansetu -F c -b -v -f /backups/kisansetu_$(date +%Y%m%d).dump
   ```
3. Store encrypted backups in cold cloud storage (e.g., AWS S3 with Glacier lifecycle).

---

## 13. Failure Recovery

- **Database Disconnection:** If PostgreSQL drops connection, `/health/ready` returns HTTP 503, preventing traffic routing to unready pods. Once the database recovers, connection pooling resumes without requiring process restart.
- **Container Crash:** Docker Compose and Kubernetes define `restart: unless-stopped`, automatically spinning up a new container.

---

## 14. Production Deployment Checklist

- [ ] `NODE_ENV=production` set in environment.
- [ ] Strong, random `JWT_SECRET` generated (min 32 characters, no dev placeholders).
- [ ] Managed PostgreSQL connection URL configured in `DATABASE_URL`.
- [ ] Explicit CORS `ALLOWED_ORIGINS` specified (no wildcard `*`).
- [ ] `DEMO_MODE=false` set.
- [ ] `npm run db:migrate:prod` executed before serving traffic.
- [ ] Healthcheck probes `/health/live` and `/health/ready` configured in orchestrator.
- [ ] SSL/TLS certificate configured on ingress / reverse proxy.
- [ ] Rate limits tuned for anticipated procurement season traffic spikes.
