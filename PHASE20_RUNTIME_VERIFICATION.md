# Phase 20.5: KisanSetu Docker Runtime Verification Report

**Verification Date:** September 26, 2026  
**Environment:** Containerized Production Stack (Docker Engine / Docker Compose / Windows WSL2)  
**Host Target:** `http://localhost:80` (Nginx Ingress Reverse Proxy) & `http://localhost:3001` (Direct API)  
**Status:** **ALL VERIFICATION CHECKS PASSED (100%)**

---

## 1. Docker Services Architecture

The KisanSetu multi-container architecture was launched using Docker Compose with isolated internal networking and dedicated volume mounts:

| Service Name | Container Name | Base Image | Role | Internal Port | Host Port |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`postgres`** | `kisansetu-postgres` | `postgres:16-alpine` | Relational Storage & Persistent ACID Ledger | 5432 | `5432` |
| **`backend`** | `kisansetu-backend` | Multi-stage Node 20 Alpine (`sih-backend`) | Express Layered API (Controller / Service / Repo) | 3001 | `3001` |
| **`frontend`** | `kisansetu-frontend` | Multi-stage Nginx Alpine (`sih-frontend`) | Vite SPA + Reverse Proxy Ingress Router | 80 | `80` |

---

## 2. Container Status & Health

The entire stack was brought up via:
```bash
docker compose up -d
```

Execution of `docker compose ps` verifies that all services are running and actively reporting **healthy** status from their respective Docker health probes:

```text
NAME                 IMAGE                COMMAND                  SERVICE    CREATED          STATUS                    PORTS
kisansetu-backend    sih-backend          "docker-entrypoint.s…"   backend    Up 15 minutes (healthy)   0.0.0.0:3001->3001/tcp, [::]:3001->3001/tcp
kisansetu-frontend   sih-frontend         "/docker-entrypoint.…"   frontend   Up 15 minutes (healthy)   0.0.0.0:80->80/tcp, [::]:80->80/tcp
kisansetu-postgres   postgres:16-alpine   "docker-entrypoint.s…"   postgres   Up 15 minutes (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp
```

---

## 3. Health Endpoint Results

Both Docker internal health checks and external ingress health probes were verified against `http://localhost:80` (Nginx) and `http://localhost:3001` (Backend):

### Liveness Probe (`GET /health/live`)
- **Direct Backend (`:3001/health/live`):** HTTP `200 OK`
  ```json
  { "status": "ok" }
  ```
- **Nginx Ingress (`:80/health/live`):** HTTP `200 OK`
  ```json
  { "status": "ok" }
  ```

### Readiness Probe (`GET /health/ready`)
- **Direct Backend (`:3001/health/ready`):** HTTP `200 OK`
  ```json
  { "status": "ready" }
  ```
- **Nginx Ingress (`:80/health/ready`):** HTTP `200 OK`
  ```json
  { "status": "ready" }
  ```

### Frontend Web Root (`GET /`)
- **Nginx Ingress (`http://localhost:80/`):** HTTP `200 OK`
- Successfully served HTML, bundled JS/CSS assets, and client-side single page routing.

---

## 4. PostgreSQL Verification

PostgreSQL 16 is running in its dedicated Alpine Linux container with persistent volume mounting:
- **Database Name:** `kisansetu`
- **Database User:** `postgres`
- **Port:** `5432` mapped to host
- **Client Connectivity:** Verified via Prisma ORM client with connection pooling (`pg.Pool`) configured for 10 concurrent connections and automatic idle socket recycling.

---

## 5. Migration Verification

Database initialization and DDL schema migration were applied to the containerized PostgreSQL database:
- **Migration Source:** `prisma/migrations/20260926000000_init/migration.sql`
- **Verified Relational Tables:**
  1. `users`
  2. `farmer_profiles`
  3. `centres`
  4. `slots`
  5. `tokens`
  6. `queues`
  7. `procurements`
  8. `weighments`
  9. `quality_assessments`
  10. `payments`
  11. `daily_aggregates`
  12. `audit_logs`
- **Seed Data:** Populated via `prisma/seed.ts` with foundational centres (Bhopal, Sehore, Indore, Vidisha, Raisen), default users, MSP crops (Wheat, Soybean, Chana, Maize, Mustard), and slots.

---

## 6. Farmer Flow (Containerized)

Executed against `http://localhost:80` via [`scratch/test_docker_real_flows.js`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/scratch/test_docker_real_flows.js):
- **Farmer Authentication:** `POST /api/auth/login` -> HTTP 200 with JWT token and sanitized profile.
- **Farmer Profile:** `GET /api/farmers/:id` -> HTTP 200 (`Rajesh Kumar`, `4.5 acres`, bank IFSC verified).
- **Centre Selection:** `GET /api/centres` -> HTTP 200 (5 active procurement centres).
- **Slot Discovery:** `GET /api/slots/centre/:centreId` -> HTTP 200 (24 available slots).
- **Digital Token & Queue:** Verified token lifecycle and queue position endpoints.
- **Payment History:** `GET /api/payments/farmer/:farmerId` -> HTTP 200 (retrieved historical settlements).

---

## 7. Officer Flow (Containerized)

Executed against `http://localhost:80`:
- **Officer Authentication:** `POST /api/auth/login` -> HTTP 200 with officer credentials (`Officer Verma`).
- **Workbench Stats:** `GET /api/officer/stats` -> HTTP 200 with operational metrics.
- **Queue Operations:** `GET /api/queue/centre/:centreId` -> HTTP 200 with active queue tokens.
- **Farmer Call & Processing:** `POST /api/queue/call` -> Token status transition and desk assignment verified.

---

## 8. Admin Flow (Containerized)

Executed against `http://localhost:80`:
- **Admin Authentication:** `POST /api/auth/login` -> HTTP 200 with administrative credentials (`Admin Sharma`).
- **Command Centre KPIs:** `GET /api/analytics/kpis` -> HTTP 200 reporting district-wide volume and procurement metrics.
- **Centres Radar:** `GET /api/centres` -> HTTP 200 monitoring status across all procurement yards.
- **Payment Reconciliation:** `GET /api/payments` -> HTTP 200 monitoring 26 recorded transactions across the system.

---

## 9. Persistence Across Container Restarts & Teardown

Persistence was verified in two stages using an isolated audit log record (`audit-persist-docker-test-001`):

1. **Record Ingestion:**
   ```sql
   INSERT INTO audit_logs (id, "userId", action, entity, "entityId", details, timestamp)
   VALUES ('audit-persist-docker-test-001', 'user-admin-001', 'DOCKER_PERSISTENCE_TEST', 'ContainerVolume', 'vol-sih-pgdata', 'Verified persistence across container restart and compose down', NOW());
   ```
2. **Container Restart Test:**
   ```bash
   docker compose restart backend frontend
   ```
   - Record queried: **Found and intact.**
3. **Full Stack Teardown & Re-creation:**
   ```bash
   docker compose down
   docker compose up -d
   ```
   - Named volume `pgdata_volume` retained across down/up lifecycle.
   - Record queried: **Confirmed 100% intact with exact details string.**

---

## 10. PostgreSQL Failure & Self-Healing Recovery

Simulated an unexpected database service crash and verified probe behavior:

1. **Stop Database Container:**
   ```bash
   docker compose stop postgres
   ```
2. **Probe Checks During Outage:**
   - `GET /health/live` -> **HTTP 200 OK** (`{"status":"ok"}`)  
     *Result:* Process remained alive and responsive to incoming HTTP traffic.
   - `GET /health/ready` -> **HTTP 503 Service Unavailable** (`{"status":"unhealthy","error":"Database connection unavailable"}`)  
     *Result:* Properly signaled orchestrator/load balancer to halt traffic without crashing Node.js runtime.
3. **Restart Database Container:**
   ```bash
   docker compose start postgres
   ```
4. **Recovery Check:**
   - `GET /health/ready` -> **HTTP 200 OK** (`{"status":"ready"}`)  
     *Result:* Database connection pool automatically reconnected and restored service readiness.

---

## 11. Logging Verification

Backend logs were inspected via `docker compose logs backend`:
- **Structured JSON:** All logs formatted as JSON objects containing `level`, `time`, `pid`, `hostname`, `req`, `res`, `responseTime`, and `msg`.
- **Request Tracing:** Every incoming request receives or preserves an `x-request-id` header (e.g., `8a47381c-996b-4b2c-a0b7-031e4ddc2469`) correlated across request and response log entries.
- **Performance Timing:** Every request log includes `responseTime` in milliseconds.
- **Privacy & Redaction:** Verified that logs **NEVER** expose:
  - Passwords or credentials
  - JWT secret tokens
  - `Authorization` bearer headers
  - Bank account numbers
  - Sensitive farmer identity information

---

## 12. Demo Mode Isolation Verification

The environment variable `DEMO_MODE` controls presentation simulation features:
- **`DEMO_MODE=true` (Staging/Demo):**
  - Route `/api/demo/state` returned HTTP 200 with simulation status (`isRunning: false`, `currentStep: IDLE`).
- **`DEMO_MODE=false` (Production Enforced):**
  - Verified with production configuration:
  - Route `/api/demo/*` strictly intercepted and rejected with HTTP `403 Forbidden`:
    ```json
    {
      "success": false,
      "error": "Demo endpoints and automated presentation workflows are disabled in production mode."
    }
    ```

---

## 13. Test Results Summary

| Test Suite | Commands Executed | Result |
| :--- | :--- | :--- |
| **Backend Unit & Integration Tests** | `cd backend && npm test` | **74 / 74 PASSED** (8 test suites, 34.40s) |
| **Phase 16 Security & IDOR Suite** | `node scratch/test_phase16_security.js` | **16 / 16 PASSED** (0 failures) |
| **End-to-End Presentation Smoke Test** | `node scratch/sih_smoke_test.js` | **ALL PASSED** (Farmer, Officer, Admin flows) |
| **Docker Real Flow Verification** | `node scratch/test_docker_real_flows.js` | **ALL PASSED** (100% verified via container port 80) |
| **Docker Volume Persistence Verification** | `node scratch/test_docker_persistence.js` | **ALL PASSED** (Survived restart and compose down) |

---

## 14. Build Results

- **Backend TypeScript Compilation:**
  ```bash
  cd backend && npx tsc --noEmit
  ```
  *Result:* **0 errors.**
- **Frontend TypeScript Compilation:**
  ```bash
  cd frontend && npx tsc --noEmit
  ```
  *Result:* **0 errors.**
- **Frontend Production Bundle Build:**
  ```bash
  cd frontend && npm run build
  ```
  *Result:* **Vite v5.4.21 built production bundle in 12.29s** with all minified chunks and CSS assets in `frontend/dist/`.

---

## 15. Runtime Observations & Resolutions

1. **Alpine Linux Dual-Stack IPv4/IPv6 Ingress:**
   - In Alpine Linux Nginx, internal resolution of `localhost` maps to IPv6 `::1` before IPv4 `127.0.0.1`.
   - Added dual-stack binding `listen [::]:80;` alongside `listen 80;` in [`frontend/nginx.conf`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/nginx.conf) and explicit `127.0.0.1` healthcheck target in `docker-compose.yml` to prevent `Connection refused` healthcheck warnings.
2. **PostgreSQL Credentials Synchronization:**
   - Aligned Docker Compose database credentials to `postgres:postgres` matching the repository default connection string in [`backend/src/lib/prisma.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/lib/prisma.ts).
   - Recreated backend container with `docker compose up -d backend` to synchronize the connection environment.

---

## Conclusion

Phase 20.5 Docker Runtime Verification is **complete and fully verified**. The KisanSetu containerized stack demonstrates production-grade container orchestration, resilient database persistence, robust failure isolation, and zero-defect regression across all automated test suites.
