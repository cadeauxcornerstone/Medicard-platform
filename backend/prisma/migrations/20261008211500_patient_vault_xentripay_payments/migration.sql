CREATE TABLE "PatientVaultPayment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "paymentMethod" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "customerReference" TEXT NOT NULL,
    "gatewayReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INITIATING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientVaultPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatientVaultPayment_customerReference_key"
ON "PatientVaultPayment"("customerReference");

CREATE INDEX "PatientVaultPayment_patientId_status_idx"
ON "PatientVaultPayment"("patientId", "status");

ALTER TABLE "PatientVaultPayment"
ADD CONSTRAINT "PatientVaultPayment_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
