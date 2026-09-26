# Phase 18 Engineering Report: PostgreSQL + Prisma Persistent Data Layer

**Project:** KisanSetu — Smart Mandi MSP Procurement Platform  
**Phase:** 18 (Data Layer Persistence Migration)  
**Date:** September 2026  
**Status:** Completed & 100% Verified  

---

## 1. Database Architecture Before Migration

Before Phase 18, KisanSetu relied entirely on an in-memory `DataStore` singleton defined in `backend/src/data/store.ts`.

### Limitations of the Pre-Migration Architecture:
1. **Zero Data Durability:** All farmer profiles, booked slots, generated digital tokens, weighbridge logs, and payment disbursements resided in Node.js process heap memory. Restarting the backend process or restarting during continuous integration wiped all states back to initial seed arrays.
2. **Lack of Concurrency Isolation:** Slot capacity booking and queue incrementing were performed via standard JavaScript array mutations (`store.slots.find()`, `slot.currentBookings++`). Under concurrent requests, race conditions could easily oversell mandi slots.
3. **No Database Constraints:** Integrity was maintained solely via imperative route logic. There were no foreign key constraints, no cascade deletions, and no uniqueness enforcement at the data store level.
4. **No ACID Multi-Record Transactions:** Complex operations such as booking a slot (which requires checking capacity, creating a token, generating a procurement record, and advancing bay counters) had no transaction boundary. A failure at step 3 left orphan records in steps 1 and 2.

---

## 2. Database Architecture After Migration

In Phase 18, KisanSetu migrated to a persistent **PostgreSQL** database managed through **Prisma ORM 7**.

### Key Architectural Upgrades:
- **Relational Integrity:** 12 relational models mapped to normalized PostgreSQL tables with foreign key constraints and `ON DELETE CASCADE` / `ON DELETE SET NULL` rules.
- **Data Access Repository Layer:** A clean, decoupled repository layer (`backend/src/repositories/`) that isolates database access logic from Express route handlers.
- **ACID Transactions:** Core operations (Slot Booking and DBT Payment Settlement) are wrapped in atomic PostgreSQL transactions via `prisma.$transaction(...)`.
- **Zero-Dependency Local Engine:** Supported both for standard hosted PostgreSQL instances (AWS RDS, Supabase, Neon) and zero-config local development via an embedded PostgreSQL engine on port 5432 with persistent storage in `backend/pgdata/`.
- **Backward Compatibility:** Routes interact cleanly with repositories while preserving compatibility with legacy telemetry queries.

---

## 3. Prisma Version Used

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `prisma` | `7.10.0` | Prisma CLI for schema management, DDL migrations, and client generation |
| `@prisma/client` | `7.10.0` | Type-safe query builder client |
| `@prisma/adapter-pg` | `7.10.0` | Official Prisma 7 driver adapter for node-postgres (`pg`) |
| `pg` | `8.23.0` | Native PostgreSQL connection pool driver |
| `@types/pg` | `8.23.1` | TypeScript definitions for connection pooling |

### Why Prisma 7?
Prisma ORM 7 was chosen specifically over Prisma 8 or untagged "latest" to maintain 100% compatibility with Node 20 LTS and TypeScript 5.3.3. In Prisma 7:
- The datasource connection URL is managed via modern `prisma.config.ts` using `defineConfig`.
- Driver adapters (`@prisma/adapter-pg`) provide high-performance connection pooling with explicit resource management.

---

## 4. Node Compatibility

- **Target Node Version:** Node.js 20 LTS (specifically verified against `node v20.x`).
- **CI Environment:** Fully compatible with GitHub Actions `ubuntu-latest` running `setup-node@v4` with `node-version: 20`.
- **TypeScript:** Fully compatible with `typescript@5.3.3` with zero compilation errors across both `backend` and `frontend`.

---

## 5. Schema & Models

The complete schema is declared in [backend/prisma/schema.prisma](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/prisma/schema.prisma):

1. **`User` (`users`):** Stores authentication identities (phone, bcrypt password hash, role, Aadhaar, preferred language).
2. **`Farmer` (`farmers`):** Government-registered farmer profile with agricultural holdings, verified bank account details, and crop lists.
3. **`Centre` (`centres`):** Regional Mandi procurement hub with capacity, bay allocation, operating hours, and congestion status.
4. **`Slot` (`slots`):** Time-scheduled entry windows with strict maximum vehicle capacities and live booking counts.
5. **`Token` (`tokens`):** Digital Mandi access tokens with unique token numbers, embedded QR payloads, queue positions, and status flags.
6. **`Produce` (`produces`):** Registered harvest lots ready for mandi intake.
7. **`Procurement` (`procurements`):** Central procurement tracking record managing the 8-stage state machine (Booked $\to$ Arrived $\to$ Gate Entry $\to$ Weighing $\to$ Quality Check $\to$ Procurement $\to$ Payment Pending $\to$ Completed).
8. **`Weighing` (`weighings`):** Weighbridge hardware measurements recording gross weight, tare weight, net weight, and calibrated scale ID.
9. **`QualityCheck` (`quality_checks`):** Agmarknet physical inspection data (moisture %, foreign matter %, damaged grain %, certified grade).
10. **`Payment` (`payments`):** Direct Benefit Transfer (DBT) records with gross calculations, statutory deductions, net amounts, NPCI/PFMS UTR references, and gateway logs.
11. **`Notification` (`notifications`):** In-app and SMS alert logs sent to users.
12. **`AuditLog` (`audit_logs`):** Append-only administrative and officer action audit trail.

---

## 6. Relationships

```
User (1) ────────── (0..1) Farmer (One-to-One Profile)
User (1) ────────── (0..*) Notification (One-to-Many Alerts)
User (1) ────────── (0..*) AuditLog (One-to-Many Actions)
Farmer (1) ──────── (0..*) Token (One-to-Many Issued Tokens)
Farmer (1) ──────── (0..*) Procurement (One-to-Many Procurements)
Farmer (1) ──────── (0..*) Payment (One-to-Many Disbursements)
Centre (1) ──────── (0..*) Slot (One-to-Many Mandi Time Slots)
Centre (1) ──────── (0..*) Token (One-to-Many Queued Tokens)
Centre (1) ──────── (0..*) Procurement (One-to-Many Procurements)
Slot (1) ────────── (0..*) Token (One-to-Many Allocated Tokens)
Token (1) ───────── (0..1) Procurement (One-to-One Lifecycle Initiation)
Procurement (1) ─── (0..1) Weighing (One-to-One Scale Measurement)
Procurement (1) ─── (0..1) QualityCheck (One-to-One Agmarknet Inspection)
Procurement (1) ─── (0..1) Payment (One-to-One DBT Settlement)
Produce (1) ─────── (0..*) Procurement (One-to-Many Crop Lots)
```

---

## 7. Constraints & Indexes

### Primary & Unique Constraints:
- `users`: Primary key `id`, unique constraint on `phone`.
- `farmers`: Primary key `id`, unique constraint on `user_id`, unique constraint on `farmer_id`, unique constraint on `phone`.
- `tokens`: Primary key `id`, unique constraint on `token_number`.
- `procurements`: Primary key `id`, unique constraint on `token_id`.
- `weighings`: Primary key `id`, unique constraint on `procurement_id`.
- `quality_checks`: Primary key `id`, unique constraint on `procurement_id`.
- `payments`: Primary key `id`, unique constraint on `procurement_id`.

### Performance Indexes Created:
- `users_phone_key` on `users(phone)`
- `farmers_phone_idx` on `farmers(phone)`
- `slots_centre_id_date_idx` on `slots(centre_id, date)`
- `tokens_centre_id_status_idx` on `tokens(centre_id, status)`
- `tokens_farmer_id_status_idx` on `tokens(farmer_id, status)`
- `procurements_farmer_id_status_idx` on `procurements(farmer_id, status)`
- `procurements_centre_id_status_idx` on `procurements(centre_id, status)`
- `payments_farmer_id_status_idx` on `payments(farmer_id, status)`
- `payments_status_idx` on `payments(status)`

---

## 8. Repository / Data-Access Structure

A dedicated repository pattern isolates Prisma database operations into domain modules:

```
backend/src/repositories/
├── index.ts                     # Central unified export barrel
├── userRepository.ts            # User lookups, authentication credentials
├── farmerRepository.ts          # Farmer profile queries and updates
├── centreRepository.ts          # Centre telemetry and status
├── slotRepository.ts            # Slot scheduling and atomic booking transaction
├── tokenRepository.ts           # Token queue, cancellations, and status updates
├── procurementRepository.ts     # Procurement state transitions, weighing & QC records
├── paymentRepository.ts         # Payment records and atomic DBT settlement transaction
└── notificationRepository.ts   # Notification alerts and read receipts
```

---

## 9. Transactions Implemented

### A. Atomic Slot Booking Transaction (`slotRepository.bookSlotAtomic`)
Prevents overbooking and ensures atomic consistency across the scheduling lifecycle:
1. Verifies that the farmer does not already hold an `ACTIVE` token in the mandi.
2. Checks slot existence and verifies `currentBookings < maxCapacity`.
3. Increments slot `currentBookings` and updates status to `FULL` if capacity is reached.
4. Generates standard digital token (`T-YYYY-NNNN`) with cryptographic QR data.
5. Creates initial `Procurement` entity with status `BOOKED`.
6. Commits all writes atomically or rolls back on any violation.

### B. Atomic DBT Payment Settlement Transaction (`paymentRepository.completePaymentAtomic`)
Eliminates split-brain states between banking disbursements and procurement lots:
1. Updates `Payment` record status to `COMPLETED` with bank UTR and DBT reference ID.
2. Updates associated `Procurement` status to `COMPLETED`.
3. Marks the farmer's `Token` as `USED`.
4. Writes an immutable audit entry to `AuditLog`.
5. Commits all 4 writes in a single database transaction.

---

## 10. Data Migration & Seeding Strategy

- **Initial DDL Migration:** Stored in `backend/prisma/migrations/20260926000000_init/migration.sql`.
- **Automatic DDL Initialization:** `backend/src/lib/prisma.ts` checks on startup if `users` table exists. If absent, DDL is applied automatically.
- **Demo Seeding Script:** `backend/prisma/seed.ts` executed via `npm run db:seed`.
- **Seeded Datasets:**
  - 110+ registered farmers with precomputed `bcrypt` password hashes (cost factor 12).
  - Admin (`admin1`) and Officer (`officer1`, `officer2`) accounts.
  - 5 Mandi procurement centres with scheduled slots.
  - Historical and active tokens, procurements, weighments, quality inspections, and DBT payments.

---

## 11. Test Results: 67/67 Tests Passing

Vitest automated test suite results across all 7 test suites:

```
 RUN  v5.0.2 C:/Users/yesvi/OneDrive/Desktop/SIH/backend

 ✓ tests/integration/authorization.test.ts (10 tests)
 ✓ tests/integration/slotsAndQueue.test.ts (8 tests)
 ✓ tests/integration/paymentDbt.test.ts (7 tests)
 ✓ tests/integration/procurementLifecycle.test.ts (5 tests)
 ✓ tests/integration/auth.test.ts (11 tests)
 ✓ tests/integration/databasePersistence.test.ts (7 tests)
 ✓ tests/unit/procurementMath.test.ts (19 tests)

 Test Files  7 passed (7)
      Tests  67 passed (67)
   Start at  17:43:44
   Duration  26.69s
```

All 60 Phase 17 tests remain green, and 7 new database persistence integration tests were added and verified.

---

## 12. Persistence Restart Test

To verify the core requirement that application data persists across full process restarts, a cold-restart verification script was executed:

**Command:**
```bash
npx ts-node scripts/verify_persistence_restart.ts
```

**Execution Log:**
```
========================================================
🔄 KisanSetu Phase 18: Process Restart Persistence Test
========================================================
Stage 1: Launching Process #1 to Seed and Write Record...
--- SEEDING POSTGRESQL DATABASE ---
✅ PostgreSQL Database successfully seeded with all KisanSetu entities!
[Process 1] Successfully wrote Token TKN-PERSIST-999 and Procurement proc-persist-999 (Status: WEIGHING) to PostgreSQL.

Stage 2: Process #1 Terminated. Simulating Server Restart (1.5s delay)...
Stage 3: Launching Process #2 to Query Persisted State from Cold Start...
[Process 2] Cold start query confirmed: Procurement proc-persist-999 survived restart with Status: WEIGHING and Amount: ₹1,51,116
========================================================
🎉 PROCESS RESTART PERSISTENCE VERIFIED 100% SUCCESS!
========================================================
```

---

## 13. TypeScript Compilation & Frontend Build Results

1. **Backend TypeScript Check:**
   ```bash
   cd backend && npx tsc --noEmit
   # Exit code: 0 (Zero errors)
   ```

2. **Frontend TypeScript Check:**
   ```bash
   cd frontend && npx tsc --noEmit
   # Exit code: 0 (Zero errors)
   ```

3. **Frontend Production Build:**
   ```bash
   cd frontend && npm run build
   # Built in 5.12s (Zero errors)
   ```

---

## 14. Smoke Test & Security Regression Results

1. **Security Regression Suite (`scratch/test_phase16_security.js`):**
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
   ✅ [PASS] Test 7: Farmer requesting another farmer resource is strictly denied (403)
   ✅ [PASS] Test 8: Officer role can access authorized officer endpoints
   ✅ [PASS] Test 9: Farmer cannot access officer endpoints (403)
   ✅ [PASS] Test 10: Farmer cannot access admin endpoints (403)

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

2. **Puppeteer Headless Smoke Test (`scratch/sih_smoke_test.js`):**
   ```
   --- STARTING SIH FINAL PRESENTATION SMOKE TEST ---
   1. Testing 1-click Quick Demo Login...
   PASS: Farmer 1-click quick demo login succeeded!
   2. Testing Farmer Flow Navigation...
     [Farmer] Centres: OK
     [Farmer] Slots: OK
     [Farmer] Token: OK
     [Farmer] Queue: OK
     [Farmer] Procurement: OK
     [Farmer] Payment: OK
   3. Testing Officer Flow...
     [Officer] Workbench KPI cards count: 8
   4. Testing Admin Flow...
     [Admin] Command Centre KPI metric cards count: 4
     [Admin] Centres Radar: OK
     [Admin] Payments: OK
     [Admin] Analytics: OK
     [Admin] Reports: OK
   --- ALL SMOKE TESTS COMPLETED SUCCESSFULLY ---
   ```

---

## 15. Remaining Limitations

1. **In-Memory Telemetry Fallback:** A small number of specialized analytics aggregate arrays (e.g. historical 30-day radar charts) still utilize seeded aggregates. Full historical time-series analytics tables can be migrated in future phases.
2. **Database Migration CLI Deployment:** In production container environments, running `prisma migrate deploy` via entrypoint scripts should be incorporated into the deployment container lifecycle.

---

## 16. Next Recommended Phase

**Phase 19: Full 3-Tier Clean Architecture Refactoring (Controller / Service / Repository Layer)**
- Cleanly separate all Express route handlers into thin Controllers.
- Encapsulate business rules, validations, and formula evaluations inside dedicated Service classes.
- Completely deprecate and remove legacy `DataStore` references from route files.
