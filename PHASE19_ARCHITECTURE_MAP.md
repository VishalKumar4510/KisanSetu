# Phase 19 Architecture Map: Monolith to Layered Production Architecture

**Project:** KisanSetu — Smart Mandi MSP Procurement Platform  
**Phase:** 19 (Backend Layered Architecture Refactor)  
**Date:** September 2026  

---

## 1. Current Monolithic Architecture & Dependency Flow

Currently, Express route files (especially `officer.ts` at 1,156 lines) act as monolithic handlers. Business logic, state transitions, domain calculations, database access, and response formatting are coupled directly into Express callbacks.

```
[HTTP Request]
       ↓
[Route File (e.g. officer.ts)]
  ├── Extracts req.body, req.query, req.params
  ├── Invokes validation & authentication middleware
  ├── Contains domain state machine rules (BOOKED -> CALLED -> WEIGHING ...)
  ├── Calculates MSP, weight diffs, moisture penalties directly
  ├── Queries Prisma / DataStore directly or via repositories
  ├── Handles payment gateway simulation logic inline
  └── Formats and sends HTTP responses (res.json)
```

### Architectural Problems in Current Implementation:
1. **Tight Coupling to Express:** Business logic cannot be tested in isolation without mocking `req`, `res`, and `next`.
2. **Duplicated Logic:** Farmer lookup, active procurement lookup, and status checks are duplicated across `officer.ts`, `procurement.ts`, `payments.ts`, and `queue.ts`.
3. **Leaky Database Concerns:** Route handlers directly manipulate repository entities and in-memory fallbacks.
4. **Scattered State Machine:** Valid status transitions are partly in `procurement.ts`, partly in `officer.ts`, and partly in schemas.

---

## 2. Target Production Layered Architecture

The refactored backend enforces a strict unidirectional dependency graph:

```
[HTTP Client Request]
       │
       ▼
┌───────────────────────────────────────────────┐
│ 1. ROUTE LAYER (backend/src/routes/)         │
│    - URL definitions & HTTP verbs             │
│    - Middleware chaining                      │
│    - Maps route to Controller method          │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ 2. CONTROLLER LAYER (backend/src/controllers/)│
│    - Extracts req.params, req.query, req.body │
│    - Passes clean inputs to Services          │
│    - Catches domain outputs & returns res.json│
│    - NO database access, NO calculations      │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ 3. SERVICE LAYER (backend/src/services/)      │
│    - Core business logic & workflows          │
│    - Procurement state machine transitions     │
│    - FIFO queue ordering and ETA algorithms   │
│    - Orchestrates pure calculations           │
│    - Calls external integration adapters      │
│    - NO Express req/res objects               │
└───────────────┬───────────────────────┬───────┘
                │                       │
                ▼                       ▼
┌───────────────────────────┐ ┌────────────────────────────────────────┐
│ PURE CALCULATION UTILS    │ │ EXTERNAL INTEGRATION ADAPTERS          │
│ (src/services/procMath.ts)│ │ (src/services/integrations/)           │
│ - netWeight formula       │ │ - PaymentGateway (Mock/Simulator)      │
│ - MSP calculation         │ │ - NotificationProvider (Mock/SMS)      │
└───────────────┬───────────┘ └─────────────────┬──────────────────────┘
                │                               │
                └───────────────┬───────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────┐
│ 4. REPOSITORY LAYER (backend/src/repositories)│
│    - Type-safe database queries               │
│    - Atomic transaction boundaries            │
│    - Data mapping & entity hydration          │
│    - NO HTTP awareness                        │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ 5. PRISMA CLIENT & POSTGRESQL                 │
│    - PostgreSQL persistent data store         │
│    - Foreign keys, indexes, enums, triggers   │
└───────────────────────────────────────────────┘
```

---

## 3. Layer Responsibility Matrix

| Layer | Files | Permitted Responsibilities | Prohibited Responsibilities |
| :--- | :--- | :--- | :--- |
| **Routes** | `routes/*.ts` | Endpoint path mapping, middleware assembly (`authenticateToken`, `requireRole`, `validateBody`) | Business logic, DB queries, direct response generation |
| **Controllers** | `controllers/*.ts` | Extracting typed inputs from HTTP request, invoking corresponding service, returning standard API responses | Prisma calls, mathematical calculations, domain validation |
| **Services** | `services/*.ts` | State machine enforcement, workflow orchestration, business validation, calling calculation modules, invoking repositories | Express `req`/`res`, SQL/Prisma code, raw HTTP formatting |
| **Repositories** | `repositories/*.ts` | Type-safe data querying, database transactions (`bookSlotAtomic`, `completePaymentAtomic`), entity mapping | Express middleware, HTTP headers, role checks, business formulas |
| **Pure Utils** | `services/procurementMath.ts` | MSP calculations, net weight formulas, moisture and quality deductions | State mutations, DB access, side effects |
| **Adapters** | `services/integrations/` | External gateway simulators (NPCI/PFMS, SMS/Notification) | Express request handling |

---

## 4. Planned Extraction Roadmap

### 1. Controllers to Create
- `officerController.ts`
- `queueController.ts`
- `procurementController.ts`
- `paymentController.ts`

### 2. Services to Create & Organize
- `officerService.ts`: Operations metrics, current farmer active desk, calling farmer, weighment recording, quality recording, calculation, receipt generation.
- `queueService.ts`: Position calculation, ETA estimation, queue pause/resume, FIFO bay allocation.
- `procurementService.ts`: Central state machine validator, lifecycle progression, farmer history.
- `paymentService.ts`: Payment review sheet preparation, DBT payment initiation, gateway retry simulation, settlement execution.
- `integrations/paymentGateway.ts`: Clean interface and simulation adapter for banking/DBT settlements.
- `integrations/notificationProvider.ts`: Clean interface and simulation adapter for farmer notifications.

### 3. Route Thinning
- Refactor `routes/officer.ts` from 1,156 lines down to thin route-to-controller declarations.
- Keep route URLs, HTTP verbs, and Zod schemas 100% identical to maintain zero frontend breaking changes.
- Ensure all 67 Vitest tests, 16 security tests, and Puppeteer smoke tests remain green after each extraction step.
