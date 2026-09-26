# KisanSetu Observability & Telemetry Architecture

This document describes the observability stack, logging architecture, request correlation, health checks, and privacy protections implemented in KisanSetu.

---

## 1. Structured Logging Architecture

KisanSetu uses **Pino** for structured JSON logging. Pino is designed for high-performance, asynchronous streaming with near-zero overhead.

### Log Format
Every log message is emitted as a single-line JSON object:

```json
{
  "level": "info",
  "time": "2026-09-26T14:32:41.784Z",
  "pid": 5976,
  "hostname": "kisan-node-pod-774b9",
  "requestId": "0115e46b-4c09-4796-b730-9a2a0e8c7116",
  "req": {
    "id": "0115e46b-4c09-4796-b730-9a2a0e8c7116",
    "method": "POST",
    "url": "/api/auth/login",
    "headers": {
      "authorization": "[REDACTED]"
    }
  },
  "res": {
    "statusCode": 200,
    "headers": {
      "x-request-id": "0115e46b-4c09-4796-b730-9a2a0e8c7116"
    }
  },
  "responseTime": 167,
  "msg": "POST /api/auth/login completed with status 200"
}
```

### Log Levels
- `fatal` (60): Critical configuration errors or fatal process exits.
- `error` (50): Unhandled 500 exceptions, broken database queries, or gateway timeouts.
- `warn` (40): Client validation failures (400), authentication failures (401), unauthorized actions (403), or degraded dependencies.
- `info` (30): Completed HTTP transactions, container lifecycle events, and audit actions.
- `debug` (20): Healthcheck probes, detailed payload structures (in non-production).
- `trace` (10): Raw socket reads and granular execution tracing.

---

## 2. Request Correlation (`x-request-id`)

Tracing requests end-to-end across frontend, API gateway, backend services, and database logs is enabled by request correlation.

### Correlation Lifecycle:
```
1. Client sends request (Optional: Header 'x-request-id: abc-123')
   │
   ▼
2. 'requestIdMiddleware' inspects incoming header:
   ├─ Valid format (alphanumeric, 8-64 chars): Reuse
   └─ Missing or invalid: Generate UUIDv4 via crypto
   │
   ▼
3. Request context tagged: 'req.id = requestId'
   │
   ▼
4. Response header injected: 'res.setHeader("x-request-id", requestId)'
   │
   ▼
5. Pino HTTP logger includes 'requestId' on every entry
   │
   ▼
6. Global error handler tags unexpected exceptions with 'requestId'
```

### Finding a Failed Request in Log Ingestion (e.g. Datadog / CloudWatch):
```
@requestId:"0115e46b-4c09-4796-b730-9a2a0e8c7116"
```

---

## 3. Privacy-Safe Redaction

In compliance with data protection principles and Indian Digital Personal Data Protection (DPDP) standards, sensitive farmer and financial data is strictly redacted at the logging layer.

### Redacted Fields:
- `authorization` (Bearer tokens)
- `cookie` & `set-cookie`
- `password`, `*.password`, `body.password`
- `token`, `*.token`, `body.token`
- `aadhaar`, `*.aadhaar`, `body.aadhaar`
- `bankAccount`, `*.bankAccount`, `body.bankAccount`

When any log statement captures an object containing these keys, Pino replaces the values with:
```
"[REDACTED]"
```

---

## 4. Health Probes & Readiness Checks

KisanSetu implements standard cloud-native health endpoints:

### Liveness Probe (`GET /health/live`)
- **Target:** Informs container orchestrator (Kubernetes, AWS ECS) whether the process is alive.
- **Dependency Isolation:** Does not query the database.
- **Success Response:** `{"status": "ok"}` (HTTP 200)

### Readiness Probe (`GET /health/ready`)
- **Target:** Informs load balancers whether this instance is ready to receive client traffic.
- **Dependency Verification:** Executes `SELECT 1;` against the PostgreSQL database connection pool.
- **Success Response:** `{"status": "ready"}` (HTTP 200)
- **Failure Response:** `{"status": "unhealthy", "error": "Database connection unavailable"}` (HTTP 503)

---

## 5. Database Connection Pool Monitoring

- Managed via `pg.Pool` coupled with `@prisma/adapter-pg`.
- **Max Connections:** Configured to `10` per backend instance with `idleTimeoutMillis: 30000`.
- **Idle Error Prevention:** `pool.on('error', ...)` handler prevents idle connection drops from crashing the Node runtime.
- **Retry Mechanism:** Database initialization retries up to 3 times with exponential backoff on cold boot.

---

## 6. Error Monitoring & Alerting

- **Application Exceptions:** Throw `AppError(message, statusCode)`. Handled centrally by `errorHandler.ts` without disclosing stack traces.
- **Unhandled Crashes:** Caught by `errorHandler.ts`, logged with full stack in development, logged with `errorName` in production, returning sanitized `{"success": false, "error": "Internal server error"}` to clients.
