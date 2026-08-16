-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'INSURANCE_CALCULATED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "servicePriceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "insuranceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "patientAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Charge_patientId_idx" ON "Charge"("patientId");

-- CreateIndex
CREATE INDEX "Charge_encounterId_idx" ON "Charge"("encounterId");

-- CreateIndex
CREATE INDEX "Charge_serviceId_idx" ON "Charge"("serviceId");

-- CreateIndex
CREATE INDEX "Charge_servicePriceId_idx" ON "Charge"("servicePriceId");

-- CreateIndex
CREATE INDEX "Charge_status_idx" ON "Charge"("status");

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_servicePriceId_fkey" FOREIGN KEY ("servicePriceId") REFERENCES "ServicePrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
