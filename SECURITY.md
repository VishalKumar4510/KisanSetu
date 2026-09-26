# 🛡️ KisanSetu Security Policy & Architecture

> **Document Status:** Active Security Architecture (Post-Phase 16 Hardening)  
> **Last Updated:** September 2026  
> **Target Audience:** Engineering Team, Security Auditors, Recruiters, and Technical Reviewers

---

## 📋 Executive Overview

KisanSetu implements a defense-in-depth model tailored for government-aligned agricultural procurement workflows. This document details the currently implemented security controls, their cryptographic backing, known operational limitations in the simulated environment, and the roadmap for production enterprise certification.

---

## 🔐 Part 1: Implemented Security Controls

### 1. Password Security & Cryptographic Hashing
- **Algorithm:** **bcrypt** with a cost factor (salt rounds) of **12**.
- **No Plaintext Passwords:** User passwords are encrypted prior to persistence. Neither database records nor API memory stores contain plaintext credentials.
- **Verification:** All authentication requests use asynchronous `bcrypt.compare()` timing-safe matching.
- **Zero Authentication Bypasses:** The hackathon-era `phone === password` bypass has been completely removed. Valid credentials with matching bcrypt hashes are strictly required for every user login.
- **Sanitized Response Objects:** The password field is explicitly stripped via destructuring (`const { password: _, ...userWithoutPassword } = user;`) from all authentication responses and user profile endpoints.

### 2. JSON Web Token (JWT) Authentication
- **Token Format:** Signed HMAC SHA-256 JWT tokens containing minimal claims (`userId`, `role`).
- **Signature Secret:** Loaded dynamically from environment variables (`process.env.JWT_SECRET`).
- **Startup Protection:** In production mode (`NODE_ENV === 'production'`), the server fails startup (`process.exit(1)`) if `JWT_SECRET` is unset, matches the default development secret, or is under 32 characters in length.
- **Expiration Policy:** Tokens expire after **24 hours**, balancing kiosk/field stability at rural mandis with session hygiene.

### 3. Role-Based Access Control (RBAC)
- **Roles:** `FARMER`, `OFFICER`, and `ADMIN`.
- **Role Enforcement Middleware:** [`requireRole(...roles)`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/middleware/auth.ts) intercepts unauthorized role transitions:
  - `FARMER` role accounts are strictly blocked (`403 Forbidden`) from:
    - Mandi operations desk (`/api/officer/*`)
    - Weighbridge gross/tare recording (`/api/officer/weighment`)
    - Quality grading & MSP calculations (`/api/officer/quality`, `/api/officer/calculate`)
    - Direct Benefit Transfer disbursals (`/api/officer/payment/*`, `/api/payments/:id/process`)
    - Mandi capacity reconfiguration (`/api/admin/*`, `/api/farmers`)

### 4. Broken Object-Level Authorization (BOLA / IDOR) Defense
- **Farmer Tenant Isolation:** Authenticated farmers cannot read or modify another farmer's data by substituting arbitrary query parameters (`?farmerId=...`) or route parameters (`/:id`).
- **Strict Server-Side Identity Verification:**
  - `GET /api/farmers/:id`: Enforces that `req.user.id === targetId`. Cross-farmer inspection returns `403 Forbidden`.
  - `GET /api/payments/current` & `GET /api/payments/history`: Strict ownership validation. Unauthorized query overrides return `403 Forbidden`.
  - `GET /api/procurement/current` & `GET /api/procurement/history`: Strict ownership validation. Unauthorized query overrides return `403 Forbidden`.
  - `GET /api/procurement/:id`: Enforces `proc.farmerId === req.user.id`. Cross-farmer access returns `403 Forbidden`.
  - `GET /api/queue/position`: Strict ownership validation.
  - `POST /api/slots/cancel`: Validates that `token.farmerId === req.user.id`. Unauthorized cancellations return `403 Forbidden`.
  - `PUT /api/notifications/:id/read`: Enforces that the notification belongs to `req.user.id`.

### 5. Input Validation via Zod Schemas
Every high-risk write and state transition endpoint passes through strongly typed Zod validation middleware before reaching business logic:
- [`auth.schema.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/schemas/auth.schema.ts): Sanitizes phone formats and enforces minimum password lengths.
- [`slot.schema.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/schemas/slot.schema.ts): Enforces non-empty slot IDs and token identifiers.
- [`officer.schema.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/schemas/officer.schema.ts):
  - Validates weighbridge tare & gross metrics ($0 < \text{Gross} \le 100,000$, $\text{Tare} \ge 0$).
  - Validates Agmarknet moisture and foreign matter ranges ($0\% \le \text{Value} \le 100\%$).
  - Validates quality evaluation result enums (`ACCEPTED`, `REJECTED`, `NEEDS_REVIEW`).
- [`procurement.schema.ts`](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/schemas/procurement.schema.ts): Enforces valid 9-stage procurement lifecycle states.
- Malformed inputs immediately terminate with standardized `400 Bad Request` payloads containing detailed field-level error messages.

### 6. Cross-Origin Resource Sharing (CORS) Hardening
- Development allows explicit localhost development origins (`http://localhost:5173`, `http://localhost:3000`, `http://localhost:4173`, `http://127.0.0.1:5173`).
- Production environments enforce strict origin matching against `process.env.ALLOWED_ORIGINS`.
- Wildcard `cors({ origin: true })` has been permanently eliminated.

### 7. Information Leakage Prevention
- Authentication failure messages return generic `Invalid credentials` with HTTP status `401 Unauthorized`, avoiding username/phone enumeration.
- Global Express error handlers suppress internal stack traces, database details, and server file paths.
- Beneficiary banking account numbers are strictly masked (`•••• •••• •••• 4519`) across all frontend and API view models.

---

## ⚠️ Part 2: Known Limitations & Demo Environment Assumptions

1. **In-Memory Data Store:**  
   State resides in the Node.js memory heap (`store.ts`). A process restart resets all newly booked slots, created tokens, and completed weighments back to the deterministic seed dataset.
2. **Rate Limiting:**  
   Basic DDoS protection and brute-force IP rate-limiting (`express-rate-limit`) are not currently enabled on `/api/auth/login`.
3. **Simulated Payment Gateway:**  
   Direct Benefit Transfer (DBT) and PFMS settlements are simulated via deterministic transaction IDs and mock banking callbacks. No real financial institutions are connected.
4. **Transport Layer Security (TLS/HTTPS):**  
   In local development, the application runs over plain HTTP (`http://localhost:3001`). Production requires terminating TLS at a reverse proxy (e.g. Nginx or AWS CloudFront).

---

## 🚀 Part 3: Future Production Hardening Roadmap

Before deploying KisanSetu to live APMC state mandi infrastructure, the following enterprise controls must be implemented:

| Category | Recommended Enhancement | Target Implementation Phase |
| :--- | :--- | :--- |
| **Persistence** | Migrate from in-memory arrays to PostgreSQL 16 with Prisma ORM and row-level locks | Phase 18 |
| **MFA / OTP** | Aadhaar-based OTP verification via UIDAI authentication API for farmer logins | Future Enterprise Phase |
| **Rate Limiting** | Redis-backed distributed rate limiting (e.g. 5 attempts per IP per 15 min on `/login`) | Phase 20 |
| **HTTP Headers** | Integrate `helmet` middleware for strict CSP, HSTS, X-Content-Type-Options | Phase 20 |
| **Secrets Vault** | Load production JWT secrets and database credentials via HashiCorp Vault or AWS KMS | DevOps / Cloud Deploy |
| **Audit Trails** | Immutable append-only audit logs stored in an external SIEM or Kafka event stream | Future Enterprise Phase |

---

*This policy is reviewed after every security hardening milestone.*
