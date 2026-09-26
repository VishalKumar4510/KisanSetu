# KisanSetu Production Architecture Specification

## 1. System Overview

**KisanSetu** is a production-grade digital Mandi procurement and token slot management platform designed for agricultural market efficiency, transparent weighment, Fair Average Quality (FAQ) grading, MSP calculation, and Direct Benefit Transfer (DBT) disbursement.

The architecture enforces a strict unidirectional layered structure:

```
[ Client (React + TypeScript) ]
               │
               ▼ HTTP / JSON
[ Express Routing Layer ]
               │
               ▼ (Params, Query, Body parsing & HTTP Statuses)
[ Controller Layer ]
               │
               ▼ (Domain Logic, State Machine, Orchestration)
[ Service Layer ]
               │
               ▼ (Typed Database Boundaries & Abstracted SQL)
[ Repository Layer ]
               │
               ▼ (ORM Client & Queries)
[ Prisma 7 + PostgreSQL ]
```

---

## 2. Frontend / Backend Relationship

- **Frontend (`/frontend`)**: React 18 SPA bundled with Vite, typed with TypeScript, styled with TailwindCSS and custom CSS design tokens. Communicates exclusively with the backend via RESTful JSON APIs using the centralized `apiService` HTTP client.
- **Backend (`/backend`)**: Node.js Express application written in TypeScript, providing stateless RESTful APIs.
- **Shared Contracts (`/shared`)**: Common TypeScript domain types (`shared/types/index.ts`) and pure calculation utilities (`shared/utils/index.ts`) shared between frontend and backend to guarantee strict type alignment without code duplication.

---

## 3. Request Lifecycle

1. **Inbound HTTP Request**: Request arrives at Express server (`server.ts`).
2. **Global Middleware**: CORS, JSON body parser (`express.json()`), URL encoding, security headers.
3. **Route Matching & Security**:
   - `authenticateToken`: Validates Authorization Bearer JWT header, cryptographically extracts user identity and role.
   - `requireRole(...)`: Enforces Role-Based Access Control (RBAC) (e.g. `FARMER`, `OFFICER`, `ADMIN`).
   - `validateBody(schema)`: Validates request payload against Zod schema before hitting controller.
4. **Controller Delegation**: Controller unmarshals `req.params`, `req.query`, and `req.body`, delegates execution to domain services, and formats the response.
5. **Service Execution**: Pure domain service executes business rules, state transitions, validation, and coordinates with repositories and external adapters.
6. **Repository & Persistence**: Repository translates domain entity calls into atomic Prisma transactions or queries against PostgreSQL.
7. **Response & Error Handling**: Controller responds with `{ success: true, data }` or passes unhandled errors to the centralized `errorHandler`.

---

## 4. Controller Responsibilities

Located in `backend/src/controllers/`:
- **`officerController.ts`**: Officer desk actions (stats, calling next token, weighment submission, quality assessment, MSP calculation, payments).
- **`queueController.ts`**: Mandi live FIFO queue inspection, farmer wait position/ETA, administrative pause/resume.
- **`procurementController.ts`**: Current active procurement, history, status transitions, Agmarknet FAQ receipts.
- **`paymentController.ts`**: Payment status, DBT settlement execution, payment history with BOLA/IDOR protection.

**Strict Boundaries**:
- Controllers handle HTTP concerns ONLY (`req`, `res`, status codes).
- Controllers do **NOT** execute Prisma queries directly.
- Controllers do **NOT** contain business formulas or database transaction code.
- No `any` type shortcuts.

---

## 5. Service Responsibilities

Located in `backend/src/services/`:
- **`officerService.ts`**: Mandi intake desk orchestration, desk summary metrics, caller queue notifications, equipment health.
- **`queueService.ts`**: FIFO queue sorting, dynamic wait time/ETA algorithms, queue pause and resume rules.
- **`procurementService.ts`**: Procurement lifecycle tracking, Agmarknet receipt generation, status query resolution.
- **`paymentService.ts`**: DBT payment review generation, payment initiation, banking gateway simulation, atomic DBT settlement.
- **`procurementStateMachine.ts`**: Centralized source of truth for allowed state transitions.

**Strict Boundaries**:
- Services have **zero knowledge** of Express `req` and `res` objects.
- Services throw typed `AppError` instances with semantic HTTP status codes.
- Services coordinate pure calculation utilities from `shared/utils`.

---

## 6. Repository Responsibilities

Located in `backend/src/repositories/`:
- `userRepository`: User authentication, bcrypt credentials lookup, registration.
- `farmerRepository`: Farmer profile, land records, banking metadata, produce records.
- `centreRepository`: Procurement centres, capacity, active intake bays.
- `slotRepository`: Mandi time slots, capacity counter, atomic slot booking.
- `tokenRepository`: Digital tokens, queue sequencing, status updates.
- `procurementRepository`: Procurement records, weighment logs, quality checks, timeline history.
- `paymentRepository`: Payment logs, DBT reference IDs, UTR tracking, atomic DBT settlement.
- `notificationRepository`: Push notifications and farmer operational alerts.

**Strict Boundaries**:
- Repositories are the exclusive persistence boundary.
- They wrap Prisma operations in resilient try/catch blocks with DataStore fallback for fault-tolerant operation.
- They expose typed domain methods and do not perform HTTP response formatting.

---

## 7. Prisma Boundary & Data Layer

- **ORM**: Prisma 7 Client with PostgreSQL Adapter (`@prisma/adapter-pg`).
- **Connection Pool**: Dedicated `pg.Pool` connection pool managed in `backend/src/lib/prisma.ts`.
- **Database Engine**: PostgreSQL, with embedded PGlite socket fallback for zero-dependency test execution and development.
- **Schema**: Declarative schema in `backend/prisma/schema.prisma` with explicit relational mappings (`@@map`, foreign keys, cascade rules, and composite indexes).

---

## 8. Transaction Boundaries

Atomic multi-step operations are strictly wrapped in database transactions to avoid partial writes and race conditions:

### 1. `bookSlotAtomic` (`slotRepository.ts`)
Executes inside a single database transaction (`prisma.$transaction`):
1. Verifies the farmer does not already hold an `ACTIVE` token (duplicate prevention).
2. Verifies slot capacity has not been exhausted (`currentBookings < maxCapacity`).
3. Increments slot `currentBookings` and marks slot `FULL` if limit reached.
4. Generates a cryptographically unique digital `Token` with QR payload.
5. Initializes a `Procurement` record in status `BOOKED`.

### 2. `completePaymentAtomic` (`paymentRepository.ts`)
Executes inside a single database transaction (`prisma.$transaction`):
1. Verifies payment exists and is not already `COMPLETED` (double settlement protection).
2. Updates payment status to `COMPLETED`, records UTR, DBT reference ID, and completion timestamp.
3. Updates linked procurement status to `COMPLETED` and appends a verified settlement timeline entry.
4. Marks the associated token as `USED`, removing it from the active intake queue.

---

## 9. Authentication & Authorization Flow

```
Client ──[ POST /api/auth/login ]──► Express Route
                                          │
                                          ▼
                                   userRepository
                                          │
                                          ▼
                              bcrypt.compare(password, hash)
                                          │
                                          ▼
                             Sign JWT (HS256 with 32+ char secret)
                                          │
                                          ▼
                               Return Token + Sanitized User
```

- **Authentication Middleware (`authenticateToken`)**: Verifies signature, checks expiration, and sets `req.user`.
- **Role-Based Authorization (`requireRole`)**: Restricts routes to `FARMER`, `OFFICER`, or `ADMIN`.
- **BOLA / IDOR Protection**: Scoped query filters verify ownership (e.g. `req.user.id === targetFarmerId` or `req.user.role === 'ADMIN'`), strictly rejecting horizontal privilege escalation with 403 Forbidden.

---

## 10. External Provider Adapter Pattern

Located in `backend/src/services/integrations/`:
To prevent vendor lock-in and decouple core logic from third-party APIs:

- **`PaymentGateway` Interface**: Defines `processDbt(params)` and `verifyUtr(utr)`.
  - Implemented by `SimulatedPaymentGateway` for development, automated testing, and SIH demonstrations.
  - Can be replaced with production adapters (e.g. PFMS, NPCI, RazorpayX) with zero modifications to `PaymentService`.
- **`NotificationProvider` Interface**: Defines `send(notification)` and `sendBatch(notifications)`.
  - Implemented by `SimulatedNotificationProvider` for logging and in-app event dispatch.
  - Ready for integration with SMS gateways (NIC SMS Gateway, Twilio) or mobile push notifications.

---

## 11. Error Handling Architecture

- **Custom Error Class (`AppError`)**: Encapsulates `message`, `statusCode`, and operational status.
- **Async Wrapper (`asyncHandler`)**: Automatically catches rejected promises from route handlers and forwards them to `next(err)`.
- **Global Error Handler (`errorHandler.ts`)**:
  - Formats responses consistently as `{ success: false, error: message }`.
  - Maps domain error status codes:
    - `400`: Validation error / bad request
    - `401`: Missing or invalid credentials
    - `403`: Role permission or ownership violation
    - `404`: Resource not found
    - `409`: Conflict (duplicate token, already settled payment, slot full)
    - `500`: Unhandled server exception
  - Prevents credential, stack trace, or database secret leakage in production mode.

---

## 12. Testing Architecture

- **Test Framework**: Vitest with supertest for full HTTP API integration testing.
- **Test Suites (67 Automated Tests across 7 files)**:
  - `tests/unit/procurementMath.test.ts`: 19 tests verifying statutory MSP rates, moisture deductions, and net weight calculations.
  - `tests/integration/auth.test.ts`: 11 tests verifying bcrypt hashing, password bypass prevention, and JWT lifecycle.
  - `tests/integration/authorization.test.ts`: 10 tests verifying IDOR defense and role boundaries.
  - `tests/integration/slotsAndQueue.test.ts`: 8 tests verifying FIFO ordering, slot concurrency, and cancellation ownership.
  - `tests/integration/procurementLifecycle.test.ts`: 5 tests verifying the 8-stage state machine transitions.
  - `tests/integration/paymentDbt.test.ts`: 7 tests verifying payment masking, double-initiation prevention, and DBT settlement.
  - `tests/integration/databasePersistence.test.ts`: 7 tests verifying PostgreSQL data persistence across process restarts.
