# Phase 17 Engineering Report: Automated Testing & Continuous Integration

**Project**: KisanSetu — Next-Generation Smart Agri-Procurement Platform  
**Phase**: Phase 17 — Automated Testing, CI/CD Pipeline & Regression Hardening  
**Status**: Completed & Verified (60/60 Vitest tests passing, 16/16 Security tests passing, E2E Smoke test passing)  
**Date**: September 26, 2026  

---

## Executive Summary

Phase 17 successfully elevates **KisanSetu** from a hackathon demo into an enterprise-ready, resume-grade software engineering project. A complete testing pyramid has been implemented without altering the frontend UI, changing working workflows, or adding unnecessary abstractions:
- **Fast Unit Tests**: Pure domain logic (weighment mathematics, Agmarknet quality standards, MSP pricing, APMC mandi cess calculations).
- **Comprehensive Integration Tests**: HTTP/API integration testing with Vitest and Supertest covering authentication, BOLA/IDOR authorization defense, slot capacity and queue management, the strict 8-stage procurement state machine, and simulated DBT banking flows.
- **State Reset Mechanism**: Clean in-memory singleton isolation via `store.reset()` preventing inter-test state contamination.
- **Continuous Integration**: Multi-stage GitHub Actions CI workflow covering dependency installation, dual TypeScript validation, unit/integration testing, coverage reporting, and production bundle compilation.

---

## 1. Test Framework & Architecture

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Test Runner & Engine** | Vitest | `^5.0.2` | Fast ESM/TypeScript unit and integration test execution |
| **HTTP Dispatcher** | Supertest | `^7.3.0` | In-process Express API endpoint testing |
| **Coverage Provider** | `@vitest/coverage-v8` | `^5.0.2` | Native v8 code coverage analysis and reporting |
| **E2E Browser Engine** | Puppeteer-Core | `^21.6.1` | Headless Chrome browser verification of live UI workflows |
| **Type Validation** | TypeScript (`tsc`) | `^5.3.3` | Dual backend & frontend strict compile-time type verification |
| **CI Runner** | GitHub Actions | `v4` | Automated validation on `push` and `pull_request` |

---

## 2. Tests Added by Category

### A. Business Logic Unit Tests (`tests/unit/procurementMath.test.ts` — 19 Tests)
- **Weighment Math (`calculateNetWeight`)**:
  - Correct net weight calculation: `grossWeight - tareWeight = netWeight` (e.g. 5,420 kg - 1,200 kg = 4,220 kg; 42.20 quintals).
  - Tare weight exceeding gross weight throws validation error.
  - Zero and negative gross weights throw validation errors.
  - Non-negative tare weight constraint enforcement.
- **Quality Grading (`evaluateQuality`)**:
  - Grade A classification under strict Agmarknet limits (moisture ≤ 12%, foreign matter ≤ 1%, damaged grain ≤ 1.5%).
  - Grade B classification for standard mandi tolerances (moisture ≤ 14%, foreign matter ≤ 2%, damaged grain ≤ 3%).
  - Grade C (Sub-standard) classification when moisture, foreign matter, or damaged grain exceed Grade B.
  - Dedicated thresholds verified for Wheat, Paddy, Maize, Mustard, and Soybean.
  - Boundary value tests at exact parameter limits (e.g. 14.0% vs 14.01% moisture).
- **MSP & Payment Math (`calculateMspPayment`)**:
  - Known valid calculation: `quantityQuintals × MSP Rate`.
  - APMC Mandi Cess deduction: Exactly 2% of base MSP amount (`0.02 * baseMsp`).
  - Net payable amount to farmer: `baseMsp - mandiCess`.
  - Handling of decimal quantities and integer rounding (`Math.round`) to prevent floating-point currency drift.

### B. Authentication & Session Tests (`tests/integration/auth.test.ts` — 11 Tests)
- Valid login with phone number and bcrypt password returns 200 with JWT and sanitized user profile.
- Invalid password returns 401 Unauthorized with generic error message.
- Non-existent phone number returns 401 Unauthorized without leaking account existence.
- Phone number matching password bypass (`phone === password`) is strictly rejected.
- Bcrypt password verification functions accurately across Farmer, Officer, and Admin roles.
- Sanitized user response guarantees `passwordHash` and internal secrets are never returned to client.
- JWT payload contains verified claims (`id`, `phone`, `role`, `name`).
- Registration automatically hashes password via bcrypt and issues valid session.

### C. Authorization & BOLA/IDOR Tests (`tests/integration/authorization.test.ts` — 10 Tests)
- Case 1: Farmer accesses own profile on `/api/farmers/me` $\rightarrow$ `200 OK`.
- Case 2: Farmer accesses another farmer's profile on `/api/farmers/:id` $\rightarrow$ `403 Forbidden` (IDOR defense).
- Case 3: Farmer accesses own payment records $\rightarrow$ `200 OK`.
- Case 4: Farmer queries another farmer's payment via query parameter override $\rightarrow$ strictly scoped to own payments (BOLA defense).
- Case 5: Farmer accesses own active procurement $\rightarrow$ `200 OK`.
- Case 6: Farmer queries another farmer's procurement $\rightarrow$ `403 Forbidden` (BOLA/IDOR defense).
- Case 7: Farmer attempts to call officer desk endpoints (`/api/officer/stats`, `/api/officer/queue`) $\rightarrow$ `403 Forbidden`.
- Case 8: Farmer attempts to call admin management endpoints (`/api/admin/farmers`) $\rightarrow$ `403 Forbidden`.
- Case 9: Authenticated officer successfully accesses officer operations endpoints $\rightarrow$ `200 OK`.
- Case 10: Missing token returns `401 Unauthorized`; malformed or expired token returns `403 Forbidden`.

### D. Slot Booking & Queue Management Tests (`tests/integration/slotsAndQueue.test.ts` — 8 Tests)
- Valid slot booking decrements slot capacity and creates active digital token and procurement record.
- Empty or malformed slot payload rejected with `400 Validation Error`.
- Duplicate booking rejected with `409 Conflict` when farmer already holds an active token.
- Capacity exhaustion rejected with `409 Conflict` when slot capacity is full.
- Queue position and ETA dynamically calculated and returned for farmer with active token.
- Queue position endpoint strictly blocks unauthorized snooping on another farmer's queue state (`403 Forbidden`).
- Token cancellation ownership enforced: farmer cannot cancel another farmer's token (`403 Forbidden`).
- Concurrent booking race-condition simulation documents in-memory synchronization characteristics.

### E. Procurement State Machine Tests (`tests/integration/procurementLifecycle.test.ts` — 5 Tests)
- Full linear progression through the 8 states:
  $$\text{BOOKED} \rightarrow \text{CALLED} \rightarrow \text{WEIGHING} \rightarrow \text{QUALITY\_CHECK} \rightarrow \text{CALCULATED} \rightarrow \text{PAYMENT\_REVIEW} \rightarrow \text{PAYMENT\_PROCESSING} \rightarrow \text{COMPLETED}$$
- Skipping intermediate required states (e.g. attempting `BOOKED -> WEIGHING`) returns `400 Bad Request`.
- Backwards state transitions (e.g. `COMPLETED -> BOOKED`) returns `400 Bad Request`.
- Fabricated or invalid status strings rejected by Zod validation with `400 Bad Request`.
- Farmer role strictly blocked from modifying procurement status (`403 Forbidden`).

### F. Payment & DBT Settlement Tests (`tests/integration/paymentDbt.test.ts` — 7 Tests)
- Pre-payment review displays calculated breakdown with masked beneficiary account number (`****4589`).
- Initiation of simulated DBT payment advances procurement and payment to `PAYMENT_PROCESSING`.
- Simulated banking gateway timeout (`SIM_ERR_GATEWAY_TIMEOUT`) returns `400 Bad Request` and marks payment `FAILED`.
- Subsequent retry after failure successfully completes payment, generates UTR number and DBT reference ID.
- Idempotency guard: Attempting to initiate a payment on an already completed procurement returns `409 Conflict`.
- Missing or invalid payment ID returns `404 Not Found`.
- Admin role permitted to trigger DBT settlement via `/api/payments/:id/process`.
- Farmer role strictly denied from initiating or processing payments (`403 Forbidden`).

---

## 3. Files Added & Modified

### New Files Created
1. `backend/vitest.config.mts`: Vitest configuration file with Node test environment, path mappings, and v8 coverage settings.
2. `backend/src/services/procurementMath.ts`: Pure domain business logic service isolating weighment, quality grading, and MSP/cess calculations.
3. `backend/tests/unit/procurementMath.test.ts`: 19 pure unit tests for domain calculation logic.
4. `backend/tests/integration/auth.test.ts`: 11 integration tests for authentication and session security.
5. `backend/tests/integration/authorization.test.ts`: 10 integration tests for RBAC and BOLA/IDOR protection.
6. `backend/tests/integration/slotsAndQueue.test.ts`: 8 integration tests for slot booking, capacity, and queue operations.
7. `backend/tests/integration/procurementLifecycle.test.ts`: 5 integration tests for the 8-stage procurement state machine.
8. `backend/tests/integration/paymentDbt.test.ts`: 7 integration tests for payment calculation, DBT settlement, and gateway failure/retry.
9. `.github/workflows/ci.yml`: GitHub Actions continuous integration pipeline.
10. `TESTING.md`: Complete developer testing architecture guide.
11. `PHASE17_TESTING_REPORT.md`: This comprehensive verification report.

### Existing Files Modified
1. `backend/package.json`: Added `test`, `test:watch`, `test:coverage` scripts, and installed Vitest/Supertest devDependencies.
2. `backend/src/data/store.ts`: Added `reset()` method to restore clean seed data between tests, ensuring 100% test isolation.
3. `backend/src/server.ts`: Exported `app` and conditionally wrapped `app.listen()` to avoid `EADDRINUSE` port collisions when running tests.
4. `scratch/sih_smoke_test.js`: Added cross-platform environment variable fallback for Chrome executable path.

---

## 4. Test Execution Summary

```
 RUN  v5.0.2 C:/Users/yesvi/OneDrive/Desktop/SIH/backend

 ✓ tests/unit/procurementMath.test.ts (19 tests) 5ms
 ✓ tests/integration/auth.test.ts (11 tests) 1530ms
 ✓ tests/integration/procurementLifecycle.test.ts (5 tests) 1728ms
 ✓ tests/integration/paymentDbt.test.ts (7 tests) 3537ms
 ✓ tests/integration/slotsAndQueue.test.ts (8 tests) 4039ms
 ✓ tests/integration/authorization.test.ts (10 tests) 8297ms

 Test Files  6 passed (6)
      Tests  60 passed (60)
   Duration  8.92s
```

- **Total Test Suites**: 6
- **Total Tests**: 60
- **Passed**: 60 (100%)
- **Failed**: 0 (0%)

---

## 5. Code Coverage Report

Generated using `@vitest/coverage-v8`:

| Component / File | % Stmts | % Branch | % Funcs | % Lines | Critical Logic Covered |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **services/procurementMath.ts** | **95.23%** | **94.64%** | **100.00%** | **95.00%** | Weighment math, Agmarknet thresholds, MSP & cess formulas |
| **routes/auth.ts** | **96.15%** | **90.00%** | **100.00%** | **96.15%** | Login, registration, bcrypt compare, token minting |
| **schemas/ (all)** | **100.00%** | **100.00%** | **100.00%** | **100.00%** | Zod input validation schemas |
| **middleware/errorHandler.ts** | **77.77%** | **66.66%** | **100.00%** | **77.77%** | AppError, validation errors, centralized error handling |
| **routes/payments.ts** | **73.07%** | **54.54%** | **50.00%** | **76.08%** | Payment history, DBT status, admin settlement |
| **middleware/auth.ts** | **65.62%** | **50.00%** | **80.00%** | **65.62%** | JWT verification, requireRole RBAC middleware |
| **data/store.ts** | **59.92%** | **42.57%** | **60.29%** | **64.89%** | State store, data access, test reset mechanism |
| **routes/queue.ts** | **54.76%** | **37.83%** | **28.57%** | **58.33%** | Live queue ordering, ETA calculation, farmer queue queries |
| **routes/officer.ts** | **52.87%** | **31.78%** | **42.42%** | **57.57%** | State machine, weighment, quality, review, payment process |
| **routes/slots.ts** | **55.88%** | **36.36%** | **33.33%** | **56.66%** | Slot query, booking, capacity checks, token creation |
| **Overall Backend Codebase** | **48.72%** | **32.75%** | **48.29%** | **51.57%** | *Focused squarely on high-value business logic & security* |

---

## 6. Continuous Integration (CI) Workflow

Created `.github/workflows/ci.yml`:
- Trigger: `push` and `pull_request` on `main` and `master`.
- Execution Pipeline:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` (Node.js 20)
  3. `npm install` (root tooling)
  4. `npm run install:all` (backend & frontend dependencies)
  5. `cd backend && npx tsc --noEmit` (strict backend type check)
  6. `cd frontend && npx tsc --noEmit` (strict frontend type check)
  7. `cd backend && npm test` (Vitest unit and integration test suite)
  8. `cd backend && npm run test:coverage` (code coverage validation)
  9. `cd frontend && npm run build` (production asset bundling)

---

## 7. TypeScript Verification Results

### Backend (`cd backend && npx tsc --noEmit`)
- **Status**: PASSED (Exit Code: 0)
- **Errors**: 0

### Frontend (`cd frontend && npx tsc --noEmit`)
- **Status**: PASSED (Exit Code: 0)
- **Errors**: 0

---

## 8. Frontend Production Build Results

```
vite v5.4.21 building for production...
✓ 3069 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                  0.81 kB │ gzip:   0.48 kB
dist/assets/index-DJPaC90W.css                  87.28 kB │ gzip:  13.91 kB
...
✓ built in 5.58s
```
- **Status**: PASSED (Exit Code: 0)
- **Output**: Clean `dist/` bundle created with zero build errors.

---

## 9. Security Regression Test Suite Results (`scratch/test_phase16_security.js`)

```
====================================================
🔒 KisanSetu Phase 16: Security & Validation Test Suite
====================================================
--- 1. Authentication Tests ---
✅ [PASS] Test 1: Valid login returns 200 with JWT and sanitized user
✅ [PASS] Test 2: Invalid password returns 401 with generic error message
✅ [PASS] Test 3: Invalid user returns 401 without leaking user existence
✅ [PASS] Test 4: phone === password bypass no longer authenticates user
✅ [PASS] Test 5: Valid bcrypt passwords work for Admin and Officer roles

--- 2. Authorization & IDOR Tests ---
✅ [PASS] Test 6: Farmer can access own profile and own payments
✅ [PASS] Test 7: Farmer requesting another farmer resource is strictly denied (403 Forbidden)
✅ [PASS] Test 8: Officer role can access authorized officer endpoints (stats, queue)
✅ [PASS] Test 9: Farmer cannot access officer endpoints (403 Forbidden)
✅ [PASS] Test 10: Farmer cannot access admin endpoints (403 Forbidden)

--- 3. Zod Input Validation Tests ---
✅ [PASS] Test 11: Invalid slot payload returns 400 Validation Error
✅ [PASS] Test 12: Invalid weighment payload (negative grossWeight) returns 400
✅ [PASS] Test 13: Invalid quality payload (invalid enum) returns 400
✅ [PASS] Test 14: Invalid payment payload (empty paymentId) returns 400

--- 4. Resource Protection & Edge Cases ---
✅ [PASS] Test 15: Unknown resource ID returns 404 Not Found
✅ [PASS] Test 16: Unauthorized token cancellation returns 403 Forbidden

====================================================
Results: 16 Passed, 0 Failed out of 16 tests
====================================================
```
- **Status**: PASSED (16/16 Passed, 0 Failed).

---

## 10. Browser End-to-End Smoke Test Results (`scratch/sih_smoke_test.js`)

```
--- STARTING SIH FINAL PRESENTATION SMOKE TEST ---
1. Testing 1-click Quick Demo Login...
Found 3 interactive buttons on login.
Navigated after Farmer quick login: http://localhost:5173/farmer
PASS: Farmer 1-click quick demo login succeeded!
2. Testing Farmer Flow Navigation...
  [Farmer] Centres (http://localhost:5173/farmer/centres): OK (title: "KisanSetu — Smart Procurement Platform")
  [Farmer] Slots (http://localhost:5173/farmer/slots): OK (title: "KisanSetu — Smart Procurement Platform")
  [Farmer] Token (http://localhost:5173/farmer/token): OK (title: "KisanSetu — Smart Procurement Platform")
  [Farmer] Queue (http://localhost:5173/farmer/queue): OK (title: "KisanSetu — Smart Procurement Platform")
  [Farmer] Procurement (http://localhost:5173/farmer/procurement): OK (title: "KisanSetu — Smart Procurement Platform")
  [Farmer] Payment (http://localhost:5173/farmer/payment): OK (title: "KisanSetu — Smart Procurement Platform")
3. Testing Officer Flow...
Navigated after Officer quick login: http://localhost:5173/officer
  [Officer] Workbench KPI cards count: 8
4. Testing Admin Flow...
Navigated after Admin quick login: http://localhost:5173/admin
  [Admin] Command Centre KPI metric cards count: 4
  [Admin] Centres Radar (http://localhost:5173/admin/centres): OK
  [Admin] Payments (http://localhost:5173/admin/payments): OK
  [Admin] Analytics (http://localhost:5173/admin/analytics): OK
  [Admin] Reports (http://localhost:5173/admin/reports): OK
--- ALL SMOKE TESTS COMPLETED SUCCESSFULLY ---
```
- **Status**: PASSED (Exit Code: 0).

---

## 11. Remaining Architectural Gaps

1. **In-Memory Store Singleton**:
   - The backend currently persists data in an in-memory TypeScript singleton (`store.ts`). While great for zero-dependency demos and fast testing, it cannot support horizontal scaling across multiple Node.js instances or survive process restarts.
   - Database-level atomic transactions (`BEGIN ... COMMIT`) and pessimistic locking (`SELECT FOR UPDATE`) are needed to eliminate concurrent slot booking race conditions.
2. **Banking Gateway Simulation**:
   - DBT processing uses a synchronous simulation with simulated delays and error flags. Real production banking requires asynchronous webhook endpoints, idempotency keys, and cryptographically signed status callbacks from PFMS / NPCI e-Kuber.
3. **Frontend Component Unit Tests**:
   - Frontend components are covered by compilation typechecks and Puppeteer E2E smoke tests. Adding Vitest + React Testing Library unit tests for UI components would provide component-level regression safety.

---

## 12. Next Recommended Phase

**Phase 18: PostgreSQL Database Migration & Clean Repository Layer**
- Migrate from in-memory `store.ts` to PostgreSQL (or Prisma / Drizzle ORM).
- Introduce atomic database transactions with row-level locks on slot allocations.
- Implement a repository layer (`FarmerRepository`, `ProcurementRepository`, `PaymentRepository`) decoupling routes from raw storage.
- Maintain existing API contracts and ensure all 60 Vitest tests pass seamlessly against the database layer via containerized test databases (Testcontainers / SQLite fallback).
