-- CreateEnum
CREATE TYPE "PaymentAuditAction" AS ENUM ('CREATED', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "PaymentAuditLog" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "action" "PaymentAuditAction" NOT NULL,
    "previousStatus" "PaymentStatus",
    "newStatus" "PaymentStatus",
    "amount" DECIMAL(12,2),
    "currency" TEXT,
    "reference" TEXT,
    "reason" TEXT,
    "actorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentAuditLog_paymentId_idx" ON "PaymentAuditLog"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAuditLog_action_idx" ON "PaymentAuditLog"("action");

-- CreateIndex
CREATE INDEX "PaymentAuditLog_actorId_idx" ON "PaymentAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "PaymentAuditLog_createdAt_idx" ON "PaymentAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentAuditLog" ADD CONSTRAINT "PaymentAuditLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAuditLog" ADD CONSTRAINT "PaymentAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
