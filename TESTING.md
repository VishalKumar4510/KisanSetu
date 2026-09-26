# KisanSetu Testing Guide & Architecture

This document provides a comprehensive overview of the testing infrastructure, execution instructions, architecture, and coverage for the **KisanSetu** procurement platform.

---

## 1. Quick Start Commands

All commands are run from the project root or the `backend/` directory:

### Backend Unit & Integration Tests (Vitest)
```bash
# Run all automated tests once
cd backend
npm test

# Run tests in interactive watch mode (TDD workflow)
cd backend
npm run test:watch

# Run tests with detailed code coverage report (v8 provider)
cd backend
npm run test:coverage
```

### TypeScript Type-Checking
```bash
# Backend type check (strict mode)
cd backend
npx tsc --noEmit

# Frontend type check
cd frontend
npx tsc --noEmit
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

### Security Regression Test Suite (Phase 16)
```bash
# Requires backend running on http://localhost:3001
node scratch/test_phase16_security.js
```

### End-to-End Headless Browser Smoke Test
```bash
# Requires backend (3001) and frontend (5173) running
node scratch/sih_smoke_test.js
```

---

## 2. Test Architecture

The KisanSetu automated testing suite is built with a clear separation between **Pure Business Logic Unit Tests** and **HTTP/API Integration Tests**:

```
backend/
├── vitest.config.mts                   # Vitest configuration (Node environment, v8 coverage)
├── src/
│   ├── services/
│   │   └── procurementMath.ts          # Pure domain business calculations
│   ├── data/
│   │   └── store.ts                    # In-memory store with store.reset() for test isolation
│   └── server.ts                       # App factory with conditional listen (NODE_ENV !== 'test')
└── tests/
    ├── unit/
    │   └── procurementMath.test.ts     # Pure functions: weighment, grading, MSP & cess
    └── integration/
        ├── auth.test.ts                # Session security, bcrypt verification, token generation
        ├── authorization.test.ts       # BOLA/IDOR defense, RBAC role gating, token expiry
        ├── slotsAndQueue.test.ts       # Slot booking, capacity limits, token ownership & races
        ├── procurementLifecycle.test.ts # Strict 8-stage state machine transitions & guards
        └── paymentDbt.test.ts          # Payment review, DBT simulation, gateway failure & retry
```

### Key Technical Decisions:
1. **Vitest v5**: Native ESM/TypeScript support, blazing-fast execution (~9 seconds for 60 tests), and zero Babel overhead.
2. **Supertest v7**: Real HTTP dispatch against the Express `app` instance without binding to local network ports during tests.
3. **Deterministic Test Isolation**: Every integration test suite executes `store.reset()` in a `beforeEach()` hook, restoring seed data to a clean baseline so test cases never suffer from state leakage or mutation side effects.
4. **Server Factory Separation**: `server.ts` exports `app` and skips `app.listen()` when `NODE_ENV === 'test'`, eliminating `EADDRINUSE` port collision errors during CI and parallel test runs.

---

## 3. What is Unit Tested

Located in `backend/tests/unit/procurementMath.test.ts` (19 test cases):

### A. Weighment Calculations
- **Gross - Tare = Net Weight**: Normal values (e.g. 5,420 kg - 1,200 kg = 4,220 kg; 42.20 quintals).
- **Validation Constraints**: Gross weight must be strictly positive (> 0).
- **Tare Exceeding Gross**: Throws descriptive error `Tare weight cannot exceed gross weight`.
- **Zero & Negative Weights**: Throws validation error for non-positive or negative gross weights.

### B. Quality Grading (Agmarknet Standards)
- **Grade A**: Low moisture (≤ 12%), minimal foreign matter (≤ 1%), damaged grain (≤ 1.5%).
- **Grade B**: Standard acceptable mandi parameters (moisture ≤ 14%, foreign matter ≤ 2%, damaged grain ≤ 3%).
- **Grade C (Sub-standard)**: High moisture (> 14%) or high foreign matter (> 2%) or excessive damage (> 3%).
- **Crop-Specific Thresholds**: Dedicated thresholds for `WHEAT`, `PADDY`, `MAIZE`, `MUSTARD`, and `SOYBEAN`.
- **Boundary Precision**: Precise assertions at exact threshold boundaries (e.g. 14.0% moisture is Grade B; 14.01% is Grade C).

### C. MSP & Payment Formulas
- **Base MSP Calculations**: `netWeightQuintals × MSP Rate`.
- **APMC Mandi Cess**: Exactly 2% APMC mandi fee deduction (`0.02 * baseMspAmount`).
- **Payable Amount**: Net amount payable to farmer = `baseMspAmount - mandiCessAmount`.
- **Decimal Precision**: Proper rounding handling (`Math.round`) ensuring fractional currency amounts do not introduce floating-point drift.

---

## 4. What is Integration Tested

Covered across 5 integration test suites (41 test cases):

### A. Authentication & Session Security (`auth.test.ts` - 11 tests)
- Valid login with phone number and bcrypt password returns 200 with JWT and sanitized user profile.
- Phone number matching password rejected (phone===password bypass blocked).
- Password hash comparison via bcrypt.
- Password hashes and sensitive fields strictly omitted from all JSON responses.
- Token generation with valid signature and claims (`id`, `phone`, `role`, `name`).
- Registration automatically hashes password and logs in new farmer.

### B. Authorization & BOLA/IDOR Defense (`authorization.test.ts` - 10 tests)
- **Farmer Profile Access**: Farmer can read their own profile via `/api/farmers/me`.
- **IDOR Protection**: Farmer requesting another farmer's record via `/api/farmers/:id` returns `403 Forbidden`.
- **Payment Privacy**: Farmer querying payments for another farmer via query overrides receives only their own records.
- **Procurement Ownership**: Farmer attempting to view another farmer's procurement receives `403 Forbidden`.
- **RBAC Role Gating**: Farmer role attempting to call officer desk endpoints (`/api/officer/stats`, `/api/officer/queue`) receives `403 Forbidden`.
- **Admin Privilege Protection**: Farmer role attempting to access admin endpoints (`/api/admin/farmers`) receives `403 Forbidden`.
- **Authorized Officer Operations**: Valid officer JWT successfully accesses officer workbench data (`200 OK`).
- **Token Integrity**: Missing `Authorization` header returns `401 Unauthorized`; malformed or invalid JWT returns `403 Forbidden`.

### C. Slots & Queue Management (`slotsAndQueue.test.ts` - 8 tests)
- Valid booking decrements slot capacity and creates an active digital token and procurement record.
- Empty or malformed slot payload rejected with `400 Validation Error`.
- Duplicate booking rejected with `409 Conflict` when a farmer already holds an active token.
- Capacity exhaustion rejected with `409 Conflict` when slot capacity reaches maximum.
- Accurate queue position calculation and ETA based on active queue ordering.
- Queue position endpoint strictly blocks unauthorized snooping on another farmer's queue state (`403 Forbidden`).
- Token cancellation ownership enforced: farmers can only cancel their own tokens.
- Concurrent booking race condition simulation identifies in-memory synchronization limits.

### D. Procurement State Machine (`procurementLifecycle.test.ts` - 5 tests)
Strict step-by-step enforcement of the 8 procurement states:
$$\text{BOOKED} \rightarrow \text{CALLED} \rightarrow \text{WEIGHING} \rightarrow \text{QUALITY\_CHECK} \rightarrow \text{CALCULATED} \rightarrow \text{PAYMENT\_REVIEW} \rightarrow \text{PAYMENT\_PROCESSING} \rightarrow \text{COMPLETED}$$
- Valid linear lifecycle step execution succeeds.
- Skipping intermediate required states (e.g. attempting `BOOKED -> WEIGHING`) returns `400 Bad Request`.
- Backwards state transitions (e.g. `COMPLETED -> BOOKED`) strictly rejected (`400 Bad Request`).
- Fabricated or invalid status enum values rejected by Zod validation (`400 Bad Request`).
- Farmer role attempting to modify procurement status receives `403 Forbidden`.

### E. Payment & DBT Settlement (`paymentDbt.test.ts` - 7 tests)
- Pre-payment review displays calculated breakdown with masked beneficiary account number (`****4589`).
- Initiation of simulated DBT payment advances procurement and payment to `PAYMENT_PROCESSING`.
- Simulated banking gateway timeout (`SIM_ERR_GATEWAY_TIMEOUT`) returns `400` and marks payment `FAILED`.
- Subsequent retry after failure successfully completes payment, generates UTR number and DBT reference ID.
- Idempotency guard: Attempting to initiate a payment on an already completed procurement returns `409 Conflict`.
- Missing or invalid payment ID returns `404 Not Found`.
- Admin role permitted to trigger DBT settlement via `/api/payments/:id/process`.
- Farmer role strictly denied from initiating or processing payments (`403 Forbidden`).

---

## 5. What the Browser Smoke Test Covers

The end-to-end headless browser smoke test (`scratch/sih_smoke_test.js`) verifies that the entire frontend and backend work harmoniously in a real Chrome browser instance:

1. **1-Click Quick Demo Login**: Verifies automated credentials populate and authenticate cleanly for Farmer, Officer, and Admin roles.
2. **Farmer Flow Navigation**:
   - `/farmer/centres` (Procurement Centre Discovery)
   - `/farmer/slots` (Slot Booking Calendar)
   - `/farmer/token` (Digital Token & QR Display)
   - `/farmer/queue` (Live Token Calling Queue)
   - `/farmer/procurement` (Procurement Progress Timeline)
   - `/farmer/payment` (DBT Payment Status & Receipts)
3. **Officer Flow Navigation**:
   - `/officer` (Officer Workbench & KPI summary cards)
   - Live queue table rendering and verification of action buttons
4. **Admin Command Centre Navigation**:
   - `/admin` (Executive KPI Dashboard with dynamic charts)
   - `/admin/centres` (Mandi Centre Monitoring Radar)
   - `/admin/payments` (DBT Payment Settlement Oversight)
   - `/admin/analytics` (Volume & Trend Analytics)
   - `/admin/reports` (Audit & Reconciliation Reports)

---

## 6. Continuous Integration (CI) Workflow

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every `push` and `pull_request` to `main` and `master`:

```mermaid
flowchart LR
    A[Checkout Code] --> B[Setup Node.js 20]
    B --> C[Install Dependencies]
    C --> D[Backend tsc --noEmit]
    D --> E[Frontend tsc --noEmit]
    E --> F[Backend Vitest Run]
    F --> G[Backend Coverage Check]
    G --> H[Frontend Production Build]
```

---

## 7. Known Limitations

1. **In-Memory Store Singleton Concurrency**:
   - The current data store is held in memory as a TypeScript singleton (`DataStore`). While fast and zero-dependency for hackathon demonstrations, concurrent asynchronous requests can experience race conditions during slot capacity decrements under high load.
   - **Resolution Plan**: Phase 18 will introduce PostgreSQL with ACID transactions and row-level locking (`SELECT ... FOR UPDATE`) or optimistic concurrency control via Prisma/Drizzle.
2. **Deterministic Bank Gateway Simulation**:
   - DBT bank settlement (PFMS / NPCI e-Kuber / APBS) is simulated with deterministic delays, pseudo-random UTR generation, and controllable failure flags (`simulateFailure: true`).
   - Real-world integration will require webhook receivers, HMAC-SHA256 signature verification, and an asynchronous message queue (e.g. BullMQ / Redis) for background retries.
