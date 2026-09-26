-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('BOOKED', 'CALLED', 'ARRIVED', 'GATE_ENTRY', 'WEIGHING', 'QUALITY_CHECK', 'PROCUREMENT', 'PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VALIDATING', 'INITIATED', 'PROCESSING', 'COMPLETED', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ProduceType" AS ENUM ('WHEAT', 'PADDY', 'ONION', 'MAIZE', 'PULSES');

-- CreateEnum
CREATE TYPE "TokenStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SLOT_CONFIRMED', 'SLOT_REMINDER', 'QUEUE_APPROACHING', 'QUEUE_DELAY', 'GATE_ENTRY', 'WEIGHING_COMPLETED', 'QUALITY_COMPLETED', 'PROCUREMENT_COMPLETED', 'PAYMENT_PROCESSED');

-- CreateEnum
CREATE TYPE "CongestionLevel" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "aadhaar" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmers" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "landArea" DOUBLE PRECISION NOT NULL,
    "crops" TEXT[],
    "bankAccount" TEXT,
    "ifsc" TEXT,
    "bankName" TEXT,
    "bankVerificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centres" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "activeBays" INTEGER NOT NULL,
    "totalBays" INTEGER NOT NULL,
    "operatingHoursStart" TEXT NOT NULL DEFAULT '08:00',
    "operatingHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "congestionLevel" "CongestionLevel" NOT NULL DEFAULT 'GREEN',
    "contactPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "centres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "timeStart" TEXT NOT NULL,
    "timeEnd" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "tokenNumber" TEXT NOT NULL,
    "qrData" TEXT NOT NULL,
    "status" "TokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "queuePosition" INTEGER NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produces" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "type" "ProduceType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'QUINTAL',
    "grade" TEXT,
    "mspRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurements" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "produceId" TEXT NOT NULL,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'BOOKED',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "gateEntryAt" TIMESTAMP(3),
    "weighingAt" TIMESTAMP(3),
    "qualityCheckAt" TIMESTAMP(3),
    "procurementAt" TIMESTAMP(3),
    "paymentPendingAt" TIMESTAMP(3),
    "paymentProcessingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "scaleId" TEXT,
    "calculatedBaseRate" DOUBLE PRECISION,
    "calculatedAdjustment" DOUBLE PRECISION,
    "calculatedGrossAmount" DOUBLE PRECISION,
    "calculatedDeductions" DOUBLE PRECISION,
    "calculatedNetAmount" DOUBLE PRECISION,
    "timeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weighings" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "grossWeight" DOUBLE PRECISION NOT NULL,
    "tareWeight" DOUBLE PRECISION NOT NULL,
    "netWeight" DOUBLE PRECISION NOT NULL,
    "scaleId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weighings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_checks" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "crop" TEXT,
    "moistureContent" DOUBLE PRECISION NOT NULL,
    "foreignMatter" DOUBLE PRECISION NOT NULL,
    "damagedGrains" DOUBLE PRECISION,
    "grade" TEXT NOT NULL,
    "qualityResult" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT NOT NULL DEFAULT '',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "deductions" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'DBT (Direct Benefit Transfer)',
    "transactionId" TEXT,
    "utr" TEXT,
    "dbtReferenceId" TEXT,
    "initiatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "titleHi" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageHi" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "farmers_farmerId_key" ON "farmers"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "farmers_userId_key" ON "farmers"("userId");

-- CreateIndex
CREATE INDEX "farmers_district_state_idx" ON "farmers"("district", "state");

-- CreateIndex
CREATE INDEX "centres_district_state_idx" ON "centres"("district", "state");

-- CreateIndex
CREATE INDEX "centres_status_idx" ON "centres"("status");

-- CreateIndex
CREATE INDEX "slots_centreId_date_idx" ON "slots"("centreId", "date");

-- CreateIndex
CREATE INDEX "slots_date_status_idx" ON "slots"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_tokenNumber_key" ON "tokens"("tokenNumber");

-- CreateIndex
CREATE INDEX "tokens_centreId_status_idx" ON "tokens"("centreId", "status");

-- CreateIndex
CREATE INDEX "tokens_farmerId_status_idx" ON "tokens"("farmerId", "status");

-- CreateIndex
CREATE INDEX "produces_farmerId_idx" ON "produces"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "procurements_tokenId_key" ON "procurements"("tokenId");

-- CreateIndex
CREATE INDEX "procurements_centreId_status_idx" ON "procurements"("centreId", "status");

-- CreateIndex
CREATE INDEX "procurements_farmerId_status_idx" ON "procurements"("farmerId", "status");

-- CreateIndex
CREATE INDEX "procurements_status_idx" ON "procurements"("status");

-- CreateIndex
CREATE UNIQUE INDEX "weighings_procurementId_key" ON "weighings"("procurementId");

-- CreateIndex
CREATE UNIQUE INDEX "quality_checks_procurementId_key" ON "quality_checks"("procurementId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_procurementId_key" ON "payments"("procurementId");

-- CreateIndex
CREATE INDEX "payments_farmerId_status_idx" ON "payments"("farmerId", "status");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produces" ADD CONSTRAINT "produces_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_produceId_fkey" FOREIGN KEY ("produceId") REFERENCES "produces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weighings" ADD CONSTRAINT "weighings_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
