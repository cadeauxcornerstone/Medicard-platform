-- CreateTable
CREATE TABLE "DispensingRecord" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "dispensedById" TEXT NOT NULL,
    "notes" TEXT,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispensingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispensingItem" (
    "id" TEXT NOT NULL,
    "dispensingRecordId" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "quantityDispensed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispensingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispensingRecord_prescriptionId_idx" ON "DispensingRecord"("prescriptionId");

-- CreateIndex
CREATE INDEX "DispensingRecord_dispensedById_idx" ON "DispensingRecord"("dispensedById");

-- CreateIndex
CREATE INDEX "DispensingRecord_dispensedAt_idx" ON "DispensingRecord"("dispensedAt");

-- CreateIndex
CREATE INDEX "DispensingItem_dispensingRecordId_idx" ON "DispensingItem"("dispensingRecordId");

-- CreateIndex
CREATE INDEX "DispensingItem_prescriptionItemId_idx" ON "DispensingItem"("prescriptionItemId");

-- AddForeignKey
ALTER TABLE "DispensingRecord" ADD CONSTRAINT "DispensingRecord_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingRecord" ADD CONSTRAINT "DispensingRecord_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingItem" ADD CONSTRAINT "DispensingItem_dispensingRecordId_fkey" FOREIGN KEY ("dispensingRecordId") REFERENCES "DispensingRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingItem" ADD CONSTRAINT "DispensingItem_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "PrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
