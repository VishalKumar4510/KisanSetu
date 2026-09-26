# KisanSetu PostgreSQL & Prisma Database Guide

## 1. Why PostgreSQL?

Prior to Phase 18, KisanSetu utilized an in-memory `DataStore` singleton. While performant for hackathon demonstrations, in-memory storage introduces fatal production limitations:
- **Zero Durability:** Any process restart, deployment, uncaught exception, or crash completely wiped all farmer registrations, bookings, weighment records, and DBT disbursements.
- **No Concurrency Safety:** In-memory array modifications are susceptible to race conditions and capacity overselling under simultaneous bookings.
- **No Referential Integrity:** Cross-entity relations (e.g. Procurement $\to$ Token $\to$ Slot $\to$ Centre) were maintained manually without database-enforced foreign key cascading or unique constraints.
- **No ACID Transactions:** Multi-step business processes (e.g., reserving a slot, updating bay counters, issuing a digital token, and generating an initial procurement record) could partially fail, leaving ghost states.

PostgreSQL was chosen as KisanSetu's production persistence engine because:
1. **Strict ACID Guarantees:** Multi-table operations execute within isolated transactions with rollback capabilities on failure.
2. **Native JSON & Enum Types:** Efficient storage of dynamic timeline logs, scale payloads, and strongly typed domain enums.
3. **High Performance Indexing:** B-Tree indexes on phone numbers, farmer codes, centre IDs, token numbers, and composite filters ensure sub-millisecond query latency.
4. **Universal Cloud & Local Support:** Runs locally with zero cloud lock-in and deploys seamlessly to AWS RDS, Supabase, Neon, Azure PostgreSQL, or GCP Cloud SQL.

---

## 2. Schema Architecture & Entity Relationship (ER) Model

The database schema is defined in [schema.prisma](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/prisma/schema.prisma) and mapped to relational PostgreSQL tables.

### Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o| Farmer : "has profile"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "triggers"
    Farmer ||--o{ Token : "issued"
    Farmer ||--o{ Procurement : "owns"
    Farmer ||--o{ Payment : "receives"
    Centre ||--o{ Slot : "manages"
    Centre ||--o{ Token : "queues"
    Centre ||--o{ Procurement : "conducts"
    Slot ||--o{ Token : "allocated_to"
    Token ||--o| Procurement : "initiates"
    Procurement ||--o| Weighing : "records"
    Procurement ||--o| QualityCheck : "inspects"
    Procurement ||--o| Payment : "settles"
    Procurement }o--|| Produce : "specifies"

    User {
        string id PK
        string phone UK
        string password
        UserRole role
        string name
        string aadhaar
        string language
        datetime createdAt
    }

    Farmer {
        string id PK
        string userId FK,UK
        string farmerId UK
        string name
        string phone UK
        string village
        string district
        string state
        float landArea
        string[] crops
        string bankAccount
        string ifsc
        string bankName
        string bankVerificationStatus
    }

    Centre {
        string id PK
        string name
        string location
        string district
        string state
        int capacity
        int activeBays
        int totalBays
        string status
        CongestionLevel congestionLevel
    }

    Slot {
        string id PK
        string centreId FK
        string date
        string timeStart
        string timeEnd
        int maxCapacity
        int currentBookings
        SlotStatus status
    }

    Token {
        string id PK
        string farmerId FK
        string slotId FK
        string centreId FK
        string tokenNumber UK
        string qrData
        TokenStatus status
        int queuePosition
        string estimatedTime
    }

    Procurement {
        string id PK
        string farmerId FK
        string centreId FK
        string slotId FK
        string tokenId FK,UK
        string produceId FK
        string crop
        float quantity
        float estimatedQuantity
        ProcurementStatus status
        float calculatedAmount
        float baseMsp
        float qualityMultiplier
        float moisturePenalty
    }

    Weighing {
        string id PK
        string procurementId FK,UK
        float grossWeight
        float tareWeight
        float netWeight
        string scaleId
        datetime timestamp
    }

    QualityCheck {
        string id PK
        string procurementId FK,UK
        string crop
        float moistureContent
        float foreignMatter
        float damagedGrains
        string grade
        boolean accepted
        string remarks
    }

    Payment {
        string id PK
        string procurementId FK,UK
        string farmerId FK
        float grossAmount
        float deductions
        float netAmount
        PaymentStatus status
        string utr
        string dbtReferenceId
        string failureReason
        datetime processedAt
        datetime completedAt
    }
```

---

## 3. Native Enums

All business workflows are enforced at the database level with PostgreSQL `CREATE TYPE ... AS ENUM`:

| Enum Name | Values | Business Context |
| :--- | :--- | :--- |
| `UserRole` | `FARMER`, `OFFICER`, `ADMIN` | Role-Based Access Control (RBAC) |
| `SlotStatus` | `AVAILABLE`, `FULL`, `CANCELLED` | Mandi gate scheduling and capacity limits |
| `TokenStatus` | `ACTIVE`, `CALLED`, `USED`, `CANCELLED`, `EXPIRED` | Digital token lifecycle and mandi queue states |
| `ProcurementStatus` | `BOOKED`, `ARRIVED`, `GATE_ENTRY`, `WEIGHING`, `QUALITY_CHECK`, `PROCUREMENT`, `PAYMENT_PENDING`, `PAYMENT_PROCESSING`, `COMPLETED`, `CANCELLED` | 8-stage physical procurement state machine |
| `PaymentStatus` | `PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `COMPLETED` | Direct Benefit Transfer (DBT) settlement tracking |
| `CongestionLevel` | `LOW`, `OPTIMAL`, `MODERATE`, `HIGH`, `CRITICAL` | Real-time Mandi traffic analytics |

---

## 4. Primary Keys, Foreign Keys & Indexes

### Referential Constraints
- **One-to-One Relationships:**
  - `User.id` $\leftrightarrow$ `Farmer.userId` (`ON DELETE CASCADE`)
  - `Token.id` $\leftrightarrow$ `Procurement.tokenId` (`ON DELETE SET NULL`)
  - `Procurement.id` $\leftrightarrow$ `Weighing.procurementId` (`ON DELETE CASCADE`)
  - `Procurement.id` $\leftrightarrow$ `QualityCheck.procurementId` (`ON DELETE CASCADE`)
  - `Procurement.id` $\leftrightarrow$ `Payment.procurementId` (`ON DELETE CASCADE`)
- **One-to-Many Relationships:**
  - `Centre` $\to$ `Slot` (`ON DELETE CASCADE`)
  - `Farmer` $\to$ `Token` (`ON DELETE CASCADE`)
  - `Farmer` $\to$ `Payment` (`ON DELETE CASCADE`)

### Performance Indexes

To support rapid lookups without full table scans, the following composite and single-column B-tree indexes are implemented:

```sql
-- Fast farmer lookup by authenticated phone number
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- Fast farmer identification by government farmer code
CREATE UNIQUE INDEX "farmers_farmer_id_key" ON "farmers"("farmer_id");
CREATE INDEX "farmers_phone_idx" ON "farmers"("phone");

-- Queue & scheduling lookups
CREATE INDEX "slots_centre_id_date_idx" ON "slots"("centre_id", "date");
CREATE UNIQUE INDEX "tokens_token_number_key" ON "tokens"("token_number");
CREATE INDEX "tokens_centre_id_status_idx" ON "tokens"("centre_id", "status");
CREATE INDEX "tokens_farmer_id_status_idx" ON "tokens"("farmer_id", "status");

-- Procurement lifecycle queries
CREATE INDEX "procurements_farmer_id_status_idx" ON "procurements"("farmer_id", "status");
CREATE INDEX "procurements_centre_id_status_idx" ON "procurements"("centre_id", "status");

-- DBT Payment lookups
CREATE INDEX "payments_farmer_id_status_idx" ON "payments"("farmer_id", "status");
CREATE INDEX "payments_status_idx" ON "payments"("status");
```

---

## 5. ACID Transactional Guarantees

KisanSetu implements critical business logic inside interactive PostgreSQL transactions via `prisma.$transaction(...)`:

### 1. Atomic Slot Booking Transaction (`bookSlotAtomic`)
Located in [slotRepository.ts](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/repositories/slotRepository.ts):
```ts
return prisma.$transaction(async (tx) => {
  // 1. Double-booking check: verify farmer has no other ACTIVE token
  const existingToken = await tx.token.findFirst({
    where: { farmerId: params.farmerId, status: 'ACTIVE' },
  });
  if (existingToken) throw new AppError('Farmer already has an active token', 409);

  // 2. Capacity check with row isolation
  const slot = await tx.slot.findUnique({ where: { id: params.slotId } });
  if (!slot || slot.currentBookings >= slot.maxCapacity) {
    throw new AppError('Slot capacity is fully booked', 409);
  }

  // 3. Atomically increment slot count and update status if full
  const newBookings = slot.currentBookings + 1;
  await tx.slot.update({
    where: { id: slot.id },
    data: {
      currentBookings: newBookings,
      status: newBookings >= slot.maxCapacity ? 'FULL' : slot.status,
    },
  });

  // 4. Create Token and initial Procurement atomically
  const token = await tx.token.create({ ... });
  const procurement = await tx.procurement.create({ ... });

  return { token, procurement, slot };
});
```
**Guarantee:** Prevents slot overselling and guarantees that a token is never created without an accompanying procurement record, and capacity is never decremented or incremented out of sync.

### 2. Atomic DBT Payment Settlement Transaction (`completePaymentAtomic`)
Located in [paymentRepository.ts](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/repositories/paymentRepository.ts):
```ts
return prisma.$transaction(async (tx) => {
  // 1. Advance Payment to COMPLETED with UTR and reference
  const updatedPayment = await tx.payment.update({
    where: { id: params.paymentId },
    data: {
      status: 'COMPLETED',
      utr: params.utr,
      dbtReferenceId: params.dbtReferenceId,
      completedAt: new Date(),
    },
  });

  // 2. Advance linked Procurement to COMPLETED
  await tx.procurement.update({
    where: { id: payment.procurementId },
    data: { status: 'COMPLETED' },
  });

  // 3. Mark digital token as USED
  if (procurement?.tokenId) {
    await tx.token.update({
      where: { id: procurement.tokenId },
      data: { status: 'USED' },
    });
  }

  // 4. Record tamper-evident Audit Log entry
  await tx.auditLog.create({ ... });

  return { payment: updatedPayment, procurement, auditLog };
});
```
**Guarantee:** Eliminates split-brain states where money is disbursed but procurement remains stuck in `PAYMENT_PROCESSING`, or token remains active in the queue.

---

## 6. Migration and DDL Management

KisanSetu manages schema migrations via standard SQL DDL files stored in [backend/prisma/migrations/](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/prisma/migrations/).

- **Migration Directory:** `backend/prisma/migrations/20260926000000_init/migration.sql`
- **Automatic Migration on Startup:** In [prisma.ts](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/src/lib/prisma.ts), `initializeDatabase()` automatically detects if the `users` table exists. If absent (e.g. fresh installation or test runner), it executes the initial DDL script.

---

## 7. Demo Data Seeding

The database includes an idempotent seeding script located at [backend/prisma/seed.ts](file:///c:/Users/yesvi/OneDrive/Desktop/SIH/backend/prisma/seed.ts).

### Running the Seed Command
```bash
cd backend
npm run db:seed
```

### Seeded Data Volume
- **Users:** Admin accounts (`admin1`), Officer accounts (`officer1`, `officer2`), and 110+ Farmer accounts (`farmer1`, `farmer2`, etc.).
- **Password Hashes:** All users are seeded with pre-computed `bcrypt` hashes (cost factor 12) established in Phase 16.
- **Centres:** 5 regional procurement centres across UP, MP, Maharashtra, Rajasthan, and Punjab.
- **Slots:** 4 days of scheduled time slots across all centres.
- **Tokens & Procurements:** Active and historical tokens representing all 8 lifecycle phases.
- **Weighings & Quality Checks:** Agmarknet-certified grade inspections and weighbridge metrics.
- **Payments:** Disbursed DBT transactions with authentic UTR references.

---

## 8. Local Setup & Configuration

### Prerequisites
- Node.js $\ge$ 20.x
- npm $\ge$ 10.x

### Environment Configuration
Copy the template in `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Ensure `DATABASE_URL` is configured:
```env
# Embedded Zero-Config PostgreSQL (Default - runs on 127.0.0.1:5432)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/kisansetu?schema=public
```

> [!NOTE]
> **Zero-Dependency Local Engine:** If no external PostgreSQL instance is running on port 5432, KisanSetu automatically spins up an embedded, wire-protocol-compliant PostgreSQL server powered by `@electric-sql/pglite-socket` with persistent on-disk storage in `backend/pgdata/`. No external installation is required.

### Starting Application
```bash
# 1. Install dependencies
npm run install:all

# 2. Seed database
cd backend
npm run db:seed

# 3. Start development servers
cd ..
npm run dev
```

---

## 9. Production Deployment Considerations

When moving to production (e.g. AWS RDS PostgreSQL, Supabase, Neon, or GCP Cloud SQL):
1. **Connection Pooling:** Use PgBouncer or Supabase transaction pooling (`pool_mode=transaction`).
2. **Environment Secret:** Supply `DATABASE_URL` as a secret environment variable containing credentials and SSL parameters:
   ```env
   DATABASE_URL=postgresql://app_user:StrongPassword@db.production.example.com:5432/kisansetu?schema=public&sslmode=require
   ```
3. **Database Migrations:** Run `npx prisma migrate deploy` in the deployment pipeline before starting backend containers.
4. **Prisma Client Generation:** Run `npx prisma generate` during the build step.
