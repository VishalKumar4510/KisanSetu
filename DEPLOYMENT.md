# 🌾 KisanSetu — Production Deployment & CI/CD Operations Guide

This guide describes how to deploy, configure, migrate, and operate the KisanSetu application across local development, testing, staging, and enterprise cloud production environments.

---

## 1. System Architecture Topology

```
Internet / End Users (Farmers, Mandi Officers, Mandi Administrators)
                        │ HTTPS (Port 443 / 80)
                        ▼
       ┌───────────────────────────────────────────────┐
       │         Nginx Web Server / SPA Host           │
       │  (Vite Static Assets, Gzip, Security Headers) │
       └───────────────────────┬───────────────────────┘
                               │ Reverse Proxy /api/ & /health/
                               ▼
       ┌───────────────────────────────────────────────┐
       │          KisanSetu Express Backend            │
       │   (Controller / Service / State Machine)      │
       └───────────────┬───────────────────────────────┘
                       │ Connection Pool (PrismaPg + pg)
                       ▼
       ┌───────────────────────────────────────────────┐
       │           PostgreSQL Database 16              │
       │ (AWS RDS / Neon / Managed DB with SSL & Vol)  │
       └───────────────────────────────────────────────┘
```

---

## 2. Environment Separation & Configuration Strategy

KisanSetu strictly separates environments using `NODE_ENV`. Each environment has clearly defined operational characteristics:

| Parameter | Development | Test (Vitest / CI) | Staging / Demo | Production |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` | `test` | `production` (or `staging`) | `production` |
| **Database** | Embedded PGlite or local Postgres | Single-connection test Postgres / in-memory | Managed Cloud PostgreSQL | High-Availability Managed PostgreSQL (AWS RDS / Neon) with Multi-AZ |
| `DATABASE_MAX_POOL`| 1–5 | 1 | 5–10 | 10–50 (sized to server capacity) |
| `DATABASE_SSL` | `false` | `false` | `true` | `true` (enforces TLS 1.3 encryption) |
| **Migrations** | Automatic local bootstrap | In-memory schema sync | `npx prisma migrate deploy` | `npx prisma migrate deploy` (Pre-deployment pipeline step) |
| `DEMO_MODE` | `true` | `false` | `true` (for hackathon / reviews) | `false` (Strict production isolation) |
| `JWT_SECRET` | Auto-defaulted for convenience | Standardized test secret | Cryptographically random (>= 32 chars) | Cryptographically random (>= 32 chars, no dev substrings) |
| `PAYMENT_PROVIDER` | `sandbox` | `sandbox` | `sandbox` | `production` (or `sandbox` if awaiting bilateral credentials) |
| **Rate Limiter** | Relaxed (500 req/window) | Relaxed for test concurrency | 30 req/window (auth) | 30 req/window (auth), 600 req/window (general) |
| **Demo Accounts** | Auto-seeded on empty DB | Seeded per test suite | Explicitly enabled if needed | Strictly disabled (`SEED_DEMO_DATA=false`) |

---

## 3. Environment Variables Reference

All runtime configuration is managed via backend environment variables. Copy `.env.example` to `.env` before starting the services.

> **CRITICAL SECURITY RULE:**  
> Never expose secrets through Vite or frontend environment variables. Frontend only requires optional `VITE_API_URL` when API is hosted on an alternate domain.

### Server & Infrastructure
| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | String | `development` | `development`, `test`, `production` |
| `PORT` | Number | `3001` | TCP port for Express API |
| `LOG_LEVEL` | String | `info` | Logging verbosity (`fatal`, `error`, `warn`, `info`, `debug`, `trace`) |
| `ALLOWED_ORIGINS` | String | `http://localhost:5173,...` | Comma-separated list of allowed CORS origins |
| `FRONTEND_URL` | String | `http://localhost:5173` | Public URL of the frontend application |

### Database & Persistence
| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | String | *(local URI)* | Full PostgreSQL connection string with credentials |
| `DATABASE_MAX_POOL`| Number | `10` | Maximum simultaneous pooled client connections |
| `DATABASE_SSL` | Boolean| `false` | Forces TLS/SSL encryption for cloud databases |
| `SEED_DEMO_DATA` | Boolean| `false` | When true in production, seeds demo accounts if DB is empty |
| `ALLOW_PRODUCTION_TRUNCATE` | Boolean | `false` | Safety lock: prevents `TRUNCATE` in production |
| `ALLOW_LOCAL_DB_IN_PRODUCTION` | Boolean | `false` | Safety lock: prevents using `127.0.0.1` in production |

### Authentication & Rate Limiting
| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `JWT_SECRET` | String | *(dev key)* | Min 32 random characters for signing tokens |
| `RATE_LIMIT_WINDOW_MS` | Number | `900000` (15 min) | Rate limiting observation window |
| `RATE_LIMIT_MAX_AUTH` | Number | `30` | Max auth attempts per IP per window |
| `RATE_LIMIT_MAX_GENERAL` | Number | `600` | Max API requests per IP per window |
| `DEMO_MODE` | Boolean| `true` | Enables/disables quick demo login endpoints |

### Payments & Webhook Subsystem (Phase 28)
| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `PAYMENT_PROVIDER` | String | `sandbox` | Active adapter: `sandbox` (simulated DBT) or `production` |
| `PAYMENT_WEBHOOK_SECRET` | String | *(dev key)* | HMAC secret for verifying incoming webhook callbacks |
| `PFMS_API_ENDPOINT` | String | *(empty)* | Official PFMS/NPCI gateway endpoint (production only) |
| `PFMS_CLIENT_ID` | String | *(empty)* | Client ID provisioned by banking partner |
| `PFMS_CLIENT_SECRET` | String | *(empty)* | Client Secret provisioned by banking partner |
| `PFMS_WEBHOOK_SECRET` | String | *(empty)* | Webhook signature secret from banking partner |

### Notifications Subsystem (Phase 27)
| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `SMS_GATEWAY_URL` | String | *(empty)* | CDAC/NIC/GovTech SMS gateway endpoint |
| `SMS_API_KEY` | String | *(empty)* | Authentication key for SMS gateway |
| `WHATSAPP_API_URL` | String | *(empty)* | WhatsApp Business API endpoint |
| `WHATSAPP_API_KEY` | String | *(empty)* | Authentication token for WhatsApp API |

---

## 4. Production Database Migration Runbook

KisanSetu uses **Prisma ORM 7** with formal migrations stored in `backend/prisma/migrations/`.

### Migration Philosophy
* In development, embedded bootstrap keeps local workflows fast and zero-config.
* In production, **unmanaged DDL execution and runtime table mutations are disabled**.
* Migrations must be executed via `prisma migrate deploy` prior to launching new application containers.

### Migration Step-by-Step Procedure
```bash
# 1. Ensure DATABASE_URL is set in environment pointing to production PostgreSQL
export DATABASE_URL="postgresql://user:pass@db-cluster.rds.amazonaws.com:5432/kisansetu?sslmode=require"

# 2. Run migrations safely (never drops data or resets tables)
cd backend
npm run db:migrate:prod
# Equivalent to: npx prisma migrate deploy

# 3. Verify migration status
npx prisma migrate status
```

---

## 5. Zero-Downtime Rolling Deployment Procedure

To achieve zero downtime during updates in Kubernetes, AWS ECS, or Docker Swarm:

```
[Old Version Pods: Running]   ── Traffic ──>  [Ingress / Reverse Proxy]
            │
            ▼
[Deploy Step 1]: Run Database Migrations (Additive schema changes only)
            │
            ▼
[Deploy Step 2]: Launch New Version Pods
            │
            ▼
[Deploy Step 3]: Probes verify /health/live and /health/ready on new pods
            │
            ▼
[Deploy Step 4]: Ingress switches traffic to New Version Pods
            │
            ▼
[Deploy Step 5]: Old Version Pods receive SIGTERM (Gracefully drains connections)
```

### Healthcheck Gates
1. **Liveness Probe**: `GET /health/live`
   * Verifies the Node.js event loop is responding.
   * Returns HTTP 200 `{"status": "ok"}`.
2. **Readiness Probe**: `GET /health/ready`
   * Executes a database query `SELECT 1;` through the connection pool.
   * Returns HTTP 200 `{"status": "ready"}` when database is healthy.
   * Returns HTTP 503 `{"status": "unhealthy"}` if PostgreSQL is unreachable, immediately preventing traffic from routing to this instance.

---

## 6. Graceful Shutdown & Drain Mechanism

KisanSetu intercepts `SIGTERM` and `SIGINT` signals:
1. Stops the HTTP server from accepting new connections (`server.close()`).
2. Waits for active in-flight requests to complete.
3. Drains and closes the PostgreSQL connection pool (`pool.end()`).
4. Exits with exit code 0.

---

## 7. Rollback Runbook

If a critical defect is identified post-deployment:

### Application Rollback
1. Re-deploy the previous container image tag:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --no-deps backend
   ```
2. Verify `/health/ready` returns 200.

### Database Rollback Considerations
* KisanSetu migrations follow an **additive-only** evolution strategy (adding columns with `NULL` or defaults, adding enum values with `ADD VALUE IF NOT EXISTS`).
* Additive migrations allow previous application versions to continue functioning even if the newer migration remains applied in the database.

---

## 8. Containerized Deployment with Docker Compose

### Building Production Images
```bash
# Build both images using multi-stage Dockerfiles
docker build -f backend/Dockerfile -t kisansetu-backend:latest .
docker build -f frontend/Dockerfile -t kisansetu-frontend:latest .
```

### Running the Stack
```bash
# Start all services in background
docker compose up -d

# Verify container health
docker compose ps
```

All 3 containers enforce non-root security and active health checks:
* `kisansetu-postgres`: `postgres:16-alpine` with healthcheck `pg_isready`
* `kisansetu-backend`: `node:20-alpine` unprivileged user `nodejs` (UID 1001), healthcheck via `/health/live`
* `kisansetu-frontend`: `nginx:alpine` serving pre-built Vite assets with gzip, security headers, and reverse proxy

---

## 9. Security & Hardening Checklist

- [x] **No Secrets in Frontend:** Only relative `/api` paths used; zero backend secrets built into bundle.
- [x] **Non-Root Containers:** Backend runs as UID 1001 `nodejs`.
- [x] **Rate Limiting:** Protects `/api/auth/*` against brute-force login attacks.
- [x] **Security Headers:** Enforced via Helmet (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- [x] **Sensitive Field Redaction:** Passwords, tokens, Aadhaar, and bank accounts are masked in all logs.
- [x] **HMAC Webhook Verification:** Validates incoming banking callbacks before state transition.
- [x] **PostgreSQL Prepared Queries:** Prisma ORM parameterizes all SQL queries, preventing SQL injection.
- [x] **Database Safety Locks:** Truncate commands and local DB URLs strictly blocked in production.
