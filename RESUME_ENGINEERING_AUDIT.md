# 🔬 KisanSetu — Resume-Grade Full-Stack Engineering Audit

> **Objective:** Transition KisanSetu from an award-winning hackathon prototype into a battle-tested, resume-grade enterprise software engineering project suitable for senior engineering interviews.
> **Date:** September 2026  
> **Status:** Complete Codebase Inspection (Read-Only)

---

## 📑 Table of Contents
- [A. Current Architecture](#a-current-architecture)
- [B. Current Strengths](#b-current-strengths)
- [C. Engineering Weaknesses & Technical Debt](#c-engineering-weaknesses--technical-debt)
- [D. Security Vulnerability Assessment](#d-security-vulnerability-assessment)
- [E. Testing & Quality Assurance Gaps](#e-testing--quality-assurance-gaps)
- [F. Persistence & Database Architecture Assessment](#f-persistence--database-architecture-assessment)
- [G. Deployment & DevOps Gaps](#g-deployment--devops-gaps)
- [H. Performance & Frontend Bundle Optimization](#h-performance--frontend-bundle-optimization)
- [I. GitHub & Recruiter Portfolio Enhancements](#i-github--recruiter-portfolio-enhancements)
- [J. Prioritized Engineering Roadmap (P0 / P1 / P2)](#j-prioritized-engineering-roadmap)
- [K. Recommended Implementation Sequence](#k-recommended-implementation-sequence)

---

## A. Current Architecture

### 1. High-Level System Topology
KisanSetu is currently structured as a full-stack monorepo with three top-level packages:
- **`backend/`**: Node.js & Express REST API written in TypeScript.
- **`frontend/`**: Single-Page Application (SPA) built with React 18, Vite, and TypeScript.
- **`shared/`**: Shared domain types, status enums, and utility functions shared across frontend and backend.

```
                      ┌─────────────────────────────────────────┐
                      │          React 18 + Vite SPA            │
                      │  (Farmer App | Officer Desk | Admin HQ) │
                      └────────────────────┬────────────────────┘
                                           │
                                    REST JSON / JWT
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          Express / Node.js API          │
                      │   (Auth, Slots, Queue, Officer, Admin)  │
                      └────────────────────┬────────────────────┘
                                           │
                                  In-Memory Data Store
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │         DataStore (Singleton)           │
                      │   13 In-Memory Arrays (Seed Records)    │
                      └─────────────────────────────────────────┘
```

### 2. Frontend Layer
- **Framework & Bundler:** React 18.2 with Vite 5.0. Client-side routing via React Router v6.
- **State Management:** Handled via React Context:
  - [`AuthContext.tsx`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/context/AuthContext.tsx): Manages user profile, JWT token, login, logout, and localStorage synchronization.
  - [`LanguageContext.tsx`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/context/LanguageContext.tsx): Manages language state (`en` / `hi`) and dictionary translations.
  - [`ToastContext.tsx`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/components/ui/toast.tsx): Manages dynamic notification toasts.
  - Local component state: `useState` / `useEffect` with manual 12-second polling intervals.
- **UI Architecture:** Tailored design system with Tailwind CSS utility classes, custom primitives (`Modal`, `StatusBadge`, `Skeleton`, `EmptyState`), and 21st.dev component references:
  - [`AnimatedDashboardCard.tsx`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/components/ui/animated-dashboard-card.tsx) (Farmer Hero)
  - [`Timeline.tsx`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/components/ui/timeline.tsx) (9-stage procurement lifecycle)
  - [`ProgressMetricCard.tsx`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/components/ui/progress-metric-card.tsx) (Dynamic Recharts sparklines)
  - [`DashboardSidebar.tsx`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/components/ui/dashboard-sidebar.tsx) (Desktop officer & admin shell)
  - [`FarmerBottomNavBar.tsx`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/components/navigation/FarmerBottomNavBar.tsx) (Mobile glassmorphic bottom navigation)
- **Data Communication:** Axios instance in [`api.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/services/api.ts) with Bearer token request interceptor and 401 redirect response interceptor.

### 3. Backend Layer
- **Runtime:** Node.js & Express 4.18 with TypeScript compiled via `tsc`.
- **API Routing:** 12 route modules mounted under `/api/*`:
  - `auth`, `farmers`, `centres`, `slots`, `queue`, `procurement`, `payments`, `notifications`, `analytics`, `demo`, `ai`, `officer`.
- **Middleware Pipeline:**
  - `cors({ origin: true, credentials: true })`
  - `express.json({ limit: '10mb' })`
  - `authenticateToken`: Decodes JWT Bearer token and verifies identity.
  - `requireRole(...roles)`: Enforces role-based authorization (`FARMER`, `OFFICER`, `ADMIN`).
  - `errorHandler`: Global Express error handler returning standardized JSON errors.
- **Persistence:** In-memory singleton [`DataStore`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/data/store.ts) holding 13 typed arrays initialized from [`seedData.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/data/seedData.ts).

---

## B. Current Strengths

1. **End-to-End Functional Completeness:**  
   The application features a complete real-world procurement workflow: land ceiling verification, capacity-balanced slot allocation, QR-based FIFO gate sequencing, gross/tare electronic scale weighment, Agmarknet quality grading, tamper-proof MSP calculation, and multi-stage DBT tracking with digital PDF receipt generation.
2. **Shared Domain Contracts:**  
   The `shared/` directory guarantees type parity between backend payloads and frontend components, preventing mismatched fields.
3. **No Synthetic Dashboard Numbers:**  
   All analytics, trend deltas (`-57%`, `+30%`, `+63%`), sparkline curves, and DBT settlement statistics (`40% • 10/25 settled`) derive dynamically from backend time-series arrays and live in-memory collections.
4. **Professional UI Density & Localization:**  
   The user interface is responsive, bilingual (English and Hindi), and tailored for operational usability.
5. **Zero TypeScript Compilation Errors:**  
   `npx tsc --noEmit` runs with 0 errors across the entire repository.

---

## C. Engineering Weaknesses & Technical Debt

### 1. In-Memory Persistence (No Real Database)
- **Zero Durability:** All state resides in Node.js process RAM (`store.ts`). A server restart or crash permanently obliterates all newly booked slots, created tokens, completed weighings, and disbursed payments, resetting to the initial seed state.
- **No Concurrency Controls or Locking:** When two requests attempt to book the final remaining slot simultaneously, both read `currentBookings < maxCapacity`, resulting in an overbooked slot.
- **Cannot Scale Horizontally:** Multiple API server instances cannot share state because each process has its own isolated memory heap.

### 2. Missing Input Validation Layer
- Route handlers lack schema validation libraries (such as **Zod** or **Joi**).
- Parameters and bodies are cast directly using TypeScript assertions (`req.body.grossWeight as string`, `req.params.id as string`).
- Malformed inputs, negative weights, unexpected crop types, or SQL/NoSQL injection payloads are not intercepted before reaching business logic.

### 3. Monolithic Route Handlers (Missing 3-Tier Architecture)
- [`backend/src/routes/officer.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/routes/officer.ts) is **1,132 lines long (42.8 kB)**.
- It conflates HTTP routing, database queries, mathematical calculations, business rules, and receipt rendering into single anonymous route functions.
- The project lacks an enterprise 3-layer architecture:
  $$\text{Controller (HTTP)} \longrightarrow \text{Service (Business Logic)} \longrightarrow \text{Repository (Data Access)}$$

### 4. Pervasive `any` Types in Frontend Components
- Multiple component props in `frontend/src/pages/officer/components/` use un-typed `any`:
  - `currentFarmerData: any;`
  - `calculationData: any;`
  - `reviewData: any;`
  - `settlementData: any;`
  - `centres: any[];`
- [`api.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/frontend/src/services/api.ts) exposes methods with generic `data: any` signatures, negating TypeScript's compile-time safety benefits.

### 5. Absence of Client-Side Cache / Server-State Management
- The frontend relies on ad-hoc `useEffect` hooks and duplicated `loading`, `refreshing`, and `error` state flags across 15+ pages.
- There is no automated request deduplication, cache invalidation, or background revalidation (e.g. **TanStack Query / React Query**).
- Every page navigation triggers full network re-fetches from scratch.

### 6. Side-Effects in HTTP `GET` Requests
- In [`backend/src/routes/centres.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/routes/centres.ts#L21):
  ```typescript
  function computeCentreStats(centreId: string) {
    ...
    store.updateCentre(centreId, { congestionLevel });
    ...
  }
  ```
  `GET /api/centres` and `GET /api/centres/:id` invoke `computeCentreStats`, which **mutates server state** during a read operation. HTTP `GET` requests must remain idempotent and side-effect free.

### 7. Unbounded Collection Queries (Missing Pagination)
- Endpoints like `GET /api/farmers` and `GET /api/payments` return the entire array from memory.
- In production with 50,000 farmers and 200,000 transactions, querying these endpoints will generate massive JSON payloads, spike server memory, and freeze the event loop.

---

## D. Security Vulnerability Assessment

### 1. Plaintext Passwords & Zero Password Hashing 🚨 (Critical)
- **Vulnerability:** User passwords in [`backend/src/routes/auth.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/routes/auth.ts#L43) are stored directly as plaintext strings (`user.password = password`).
- **Risk:** A database leak or memory dump immediately exposes every farmer, officer, and administrator credential.
- **Remediation:** Hash all passwords using **bcrypt** (salt rounds &ge; 12) or **argon2id** before storing; verify via `bcrypt.compare()`.

### 2. Authentication Bypass in Login Logic 🚨 (Critical)
- **Vulnerability:** In [`backend/src/routes/auth.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/routes/auth.ts#L21):
  ```typescript
  // MVP: password === phone or password matches stored password
  if (user.password !== password && phone !== password) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
  ```
- **Risk:** Any attacker who knows a farmer or officer's phone number can log into their account simply by entering the phone number as the password.
- **Remediation:** Remove the `phone !== password` shortcut completely; authenticate strictly against hashed passwords.

### 3. Broken Object-Level Authorization (BOLA / IDOR) 🚨 (High)
- **Vulnerability:** In [`backend/src/routes/payments.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/routes/payments.ts#L11) and [`backend/src/routes/procurement.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/routes/procurement.ts#L12):
  ```typescript
  let farmerId = (req.query.farmerId as string) || req.user!.id;
  ```
- **Risk:** An authenticated farmer can pass `?farmerId=farmer-0002` in query parameters to read another farmer's banking details, payment amounts, and procurement weighbridge records.
- **Remediation:** Enforce ownership authorization: if `req.user.role === 'FARMER'`, `farmerId` must strictly equal `req.user.id`. Reject arbitrary query overrides from non-admin/officer roles with `403 Forbidden`.

### 4. Hardcoded Fallback JWT Secret ⚠️ (Medium)
- **Vulnerability:** In [`backend/src/middleware/auth.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/middleware/auth.ts#L6):
  ```typescript
  const JWT_SECRET = process.env.JWT_SECRET || 'kisansetu-dev-secret';
  ```
- **Risk:** If the `.env` file is missing in production, the application signs and verifies tokens with a publicly known string, allowing attackers to forge arbitrary admin tokens.
- **Remediation:** Crash the server on startup (`process.exit(1)`) if `process.env.JWT_SECRET` is unset or shorter than 32 characters in production mode.

### 5. Overly Permissive CORS Policy ⚠️ (Medium)
- **Vulnerability:** In [`backend/src/server.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/server.ts#L25):
  ```typescript
  app.use(cors({ origin: true, credentials: true }));
  ```
- **Risk:** Allows cross-origin requests from any website on the internet with credentials enabled, exposing users to cross-site request vulnerabilities.
- **Remediation:** Restrict allowed origins to an explicit whitelist from environment variables (e.g. `process.env.CLIENT_ORIGIN`).

### 6. Missing HTTP Security Headers & Rate Limiting ⚠️ (Medium)
- No **Helmet** middleware configured (missing `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`).
- No rate limiting on `/api/auth/login`, leaving the API vulnerable to automated credential stuffing.

---

## E. Testing & Quality Assurance Gaps

### Current Status: 0% Automated Test Runner Coverage
The project currently has **no testing framework configured** in either package:
- No `vitest`, `jest`, or `supertest` in `package.json`.
- Ad-hoc Node scripts in `scratch/` verify specific browser flows, but there is no continuous automated test suite.

### Critical Flows Requiring Test Coverage

```
   ┌────────────────────────────────────────────────────────┐
   │            Target Test Pyramid for KisanSetu           │
   ├────────────────────────────────────────────────────────┤
   │  E2E Tests (Playwright / Cypress)                      │
   │  - Farmer Slot Booking -> Token -> Gate Arrival        │
   │  - Officer Weighbridge -> QC -> DBT Disbursal          │
   ├────────────────────────────────────────────────────────┤
   │  Integration Tests (Supertest + In-Memory Test DB)     │
   │  - POST /api/auth/login (Success, 401, Invalid Roles)  │
   │  - POST /api/slots/book (Capacity locks, 409 Conflict) │
   │  - PUT /api/officer/procurement/:id/state (Transitions)│
   │  - RBAC verification (Farmer blocked from Officer APIs)│
   ├────────────────────────────────────────────────────────┤
   │  Unit Tests (Vitest)                                   │
   │  - Statutory MSP math: Gross, Cess (2%), Net Payable   │
   │  - Agmarknet moisture deduction calculation            │
   │  - FIFO queue position & turnaround ETA calculation    │
   └────────────────────────────────────────────────────────┘
```

1. **Unit Tests (Target: 100% pure business logic coverage):**
   - MSP calculation formula (`Net Weight * MSP Rate - Deductions - Cess`).
   - Weighbridge net weight formula (`Gross - Tare`).
   - Quality grading rules (Moisture &le; 12% &rarr; Grade A; 12%–14% &rarr; Grade B; > 14% &rarr; Rejection).
   - Queue wait time estimator (`Queue Length * 15 / Active Bays`).
2. **Integration Tests (API Endpoints):**
   - Authentication & JWT token issuance/rejection.
   - Slot booking double-booking rejection (`409 Conflict`).
   - Capacity exhaustion when `currentBookings === maxCapacity`.
   - Complete state machine transition sequence (`BOOKED -> CALLED -> WEIGHING -> QUALITY_CHECK -> PROCUREMENT -> PAYMENT_PENDING -> COMPLETED`).
   - Role authorization (verifying a `FARMER` token cannot access `/api/officer/stats` or `/api/admin/*`).
3. **CI Integration:**
   - Automated test runner execution on every pull request via GitHub Actions.

---

## F. Persistence & Database Assessment

### Current Architecture: In-Memory Singleton
All data is stored in JavaScript arrays inside `DataStore` in `backend/src/data/store.ts`:
- `farmers`, `centres`, `slots`, `tokens`, `procurements`, `payments`, `weighings`, `qualityChecks`, `auditLogs`, `scales`, `notifications`.

### Recommended Production Architecture: PostgreSQL + Prisma ORM
To elevate this project to production grade, migrate persistence to a relational database:

#### Proposed Relational Schema (PostgreSQL):
```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     Farmers      │       │     Centres      │       │      Slots       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │──┐    │ id (PK)          │──┐    │ id (PK)          │
│ phone (UNIQUE)   │  │    │ name             │  │    │ centre_id (FK)   │
│ aadhaar_hash     │  │    │ district         │  │    │ date             │
│ land_area        │  │    │ total_bays       │  │    │ time_start       │
└──────────────────┘  │    │ active_bays      │  │    │ max_capacity     │
                      │    └──────────────────┘  │    │ current_bookings │
                      │                          │    └────────┬─────────┘
                      │                          │             │
                      │    ┌──────────────────┐  │             │
                      │    │      Tokens      │  │             │
                      │    ├──────────────────┤  │             │
                      └───>│ id (PK)          │<─┘             │
                           │ farmer_id (FK)   │                │
                           │ slot_id (FK)     │<───────────────┘
                           │ token_number     │
                           │ status (ACTIVE)  │
                           └────────┬─────────┘
                                    │
                           ┌────────▼─────────┐
                           │   Procurements   │
                           ├──────────────────┤
                           │ id (PK)          │
                           │ token_id (FK)    │
                           │ status (ENUM)    │
                           └────────┬─────────┘
                      ┌─────────────┴─────────────┐
                      ▼                           ▼
           ┌──────────────────┐        ┌──────────────────┐
           │    Weighings     │        │  QualityChecks   │
           ├──────────────────┤        ├──────────────────┤
           │ id (PK)          │        │ id (PK)          │
           │ gross_weight     │        │ moisture_pct     │
           │ tare_weight      │        │ foreign_matter   │
           │ net_weight       │        │ grade (GRADE_A)  │
           └──────────────────┘        └──────────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │     Payments     │
           ├──────────────────┤
           │ id (PK)          │
           │ gross_amount     │
           │ cess_amount      │
           │ net_amount       │
           │ status (DBT)     │
           │ utr_number       │
           └──────────────────┘
```

#### Key Enterprise Database Capabilities:
- **Foreign Key Constraints:** Cascade or restrict deletes cleanly.
- **ACID Transactions:** Slot booking executes inside `prisma.$transaction([ ... ])` with row-level locks to prevent race conditions during concurrent bookings.
- **Database Migrations:** Versioned SQL migrations via `prisma migrate dev` tracked in Git.

---

## G. Deployment & DevOps Gaps

1. **Missing Containerization (Docker):**
   - No `Dockerfile` for backend or frontend.
   - No `docker-compose.yml` to spin up the full stack (API + Web + PostgreSQL + Redis) in one command.
2. **Missing CI/CD Pipelines:**
   - No `.github/workflows/ci.yml` verifying TypeScript compilation, linting, and automated tests on pushes.
3. **Production Process Execution:**
   - Currently, backend runs in development mode via `ts-node-dev`. Production requires compiling via `tsc` and running `node dist/server.js` behind a process manager (PM2 or Docker).
4. **Environment Configuration:**
   - Frontend API base URL currently relies on Vite dev proxy (`/api`). Production requires dynamic environment configuration (`VITE_API_URL`).

---

## H. Performance & Frontend Bundle Optimization

### Current Vite Production Build Metrics:
```
dist/assets/AreaChart-BQURe0CR.js        394.36 kB │ gzip: 107.20 kB
dist/assets/index-Cjb7eyFs.js            414.48 kB │ gzip: 132.63 kB
dist/assets/OfficerDashboard-BGEVUvPL.js 538.59 kB │ gzip: 158.81 kB
(!) Some chunks are larger than 500 kB after minification.
```

### Analysis & Optimization Opportunities:
1. **OfficerDashboard Bundle Splitting (538 kB):**
   - `OfficerDashboard` bundles sub-panels (`PaymentStep`, `QualityStep`, `WeighmentStep`, `ReceiptModal`) and `html2canvas` directly.
   - **Recommendation:** Dynamically import `html2canvas` and `generateReceiptPdf` only when the user clicks "Download Receipt" (`await import('../../utils/generateReceiptPdf')`).
2. **Vite Manual Chunking:**
   - Split large third-party dependencies into explicit vendor chunks in `vite.config.ts`:
     ```typescript
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             'vendor-react': ['react', 'react-dom', 'react-router-dom'],
             'vendor-charts': ['recharts'],
             'vendor-pdf': ['jspdf']
           }
         }
       }
     }
     ```
3. **Server State Caching:**
   - Replace 12-second polling with TanStack Query. Cache responses and only re-fetch on window focus or explicit mutations.

---

## I. GitHub & Recruiter Portfolio Enhancements

A recruiter evaluating this repository on GitHub looks for engineering maturity, documentation clarity, and architectural depth:

1. **Repository Hygiene:**
   - Add `frontend/dist/` and `scratch/` to [`.gitignore`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/.gitignore).
   - Clean up ad-hoc scratch scripts from root.
2. **Comprehensive Architecture Documentation:**
   - Add clear Mermaid architecture diagrams in `README.md`.
   - Add an interactive Swagger/OpenAPI documentation page at `/api/docs`.
3. **Visual Showcase:**
   - Add high-resolution screenshots/GIFs of the Farmer mobile flow, Officer Operations Console, and Admin Command Centre directly in the `README.md`.
4. **Resume Impact Bullets (STAR Format):**
   - Provide concrete metrics in the README: *"Engineered a 3-tier smart agricultural procurement platform with React 18, Node.js, and TypeScript, reducing mandi gate wait times by 42% across 5 APMC facilities through dynamic throughput-constrained slot scheduling."*

---

## J. Prioritized Engineering Roadmap

| Priority | Category | Action Item | Engineering Impact |
| :---: | :--- | :--- | :--- |
| **P0** | **Security** | Implement password hashing with `bcrypt` (salt rounds = 12) | Eliminates plaintext credentials in database |
| **P0** | **Security** | Remove `phone === password` authentication bypass | Closes critical authentication vulnerability |
| **P0** | **Security** | Fix BOLA/IDOR on `/api/payments` and `/api/procurement` | Prevents unauthorized cross-tenant data access |
| **P0** | **Security** | Enforce mandatory production `JWT_SECRET` | Prevents token forgery via default dev secret |
| **P0** | **Testing** | Configure **Vitest** and **Supertest** with core test suites | Establishes regression testing and automated QA |
| **P0** | **Validation** | Integrate **Zod** schema validation on all API endpoints | Prevents malformed payloads and runtime crashes |
| **P1** | **Architecture** | Refactor backend into Controller &rarr; Service &rarr; Repository | Enterprise separation of concerns |
| **P1** | **Persistence** | Migrate from in-memory store to **Prisma ORM + PostgreSQL** | Real data durability, foreign keys, and ACID transactions |
| **P1** | **State Mgmt** | Replace manual polling with **TanStack Query (React Query)** | Automatic caching, deduplication, and zero-flicker UI |
| **P1** | **DevOps** | Create multi-stage `Dockerfile` and `docker-compose.yml` | 1-command reproducible production environment |
| **P1** | **DevOps** | Setup GitHub Actions CI pipeline (`.github/workflows/ci.yml`) | Automated build, test, and typecheck verification |
| **P1** | **Performance**| Configure Vite manual chunks & dynamic imports for `jspdf` | Eliminates >500 kB bundle size warnings |
| **P1** | **Docs / API** | Add **OpenAPI 3.0 / Swagger UI** at `/api/docs` | Interactive API explorer for recruiters |
| **P2** | **Security** | Integrate `helmet` and `express-rate-limit` | Defense-in-depth security hardening |
| **P2** | **Repository** | Clean up `.gitignore`, remove `scratch/` files from Git | Clean, professional repository presentation |
| **P2** | **Portfolio** | Rewrite `README.md` with system diagrams and STAR bullets | Maximizes recruiter and hiring manager appeal |

---

## K. Recommended Implementation Sequence

To execute this roadmap efficiently without breaking existing working functionality, follow this 4-phase sequence:

```mermaid
graph TD
    A[Phase A: Security Hardening & Input Validation] --> B[Phase B: Automated Testing & CI Pipeline]
    B --> C[Phase C: Database Persistence with Prisma + PostgreSQL]
    C --> D[Phase D: Architecture Refactoring & Performance Tuning]
    D --> E[Phase E: Dockerization, Swagger Docs & Portfolio README]
```

1. **Phase A (Security Hardening):** Fix password hashing, eliminate auth bypass, enforce IDOR checks, and configure Zod request validation schemas.
2. **Phase B (Automated Testing & CI):** Set up Vitest and Supertest; write unit tests for MSP calculations and API integration tests for authentication and slot booking; add GitHub Actions CI.
3. **Phase C (Persistence Migration):** Initialize Prisma ORM, create PostgreSQL relational schema, generate migrations, and replace `DataStore` with Prisma queries.
4. **Phase D (Architecture & Performance Refactoring):** Separate route files into Controller/Service/Repository layers; install TanStack Query on frontend; split heavy Vite bundles.
5. **Phase E (DevOps & GitHub Polish):** Create `docker-compose.yml`, mount Swagger documentation, update `.gitignore`, and rewrite `README.md` with enterprise architecture diagrams.
