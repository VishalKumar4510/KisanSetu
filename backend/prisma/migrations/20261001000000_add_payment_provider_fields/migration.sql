-- AlterEnum: Add CREATED and REVERSED to PaymentStatus
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CREATED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REVERSED';

-- AlterTable: Add Payment Provider & Webhook Idempotency Columns
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "providerName" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "providerReference" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "webhookEventId" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "providerStatus" TEXT;
