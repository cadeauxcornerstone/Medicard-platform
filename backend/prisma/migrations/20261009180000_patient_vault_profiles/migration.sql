ALTER TABLE "Patient"
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT,
ADD COLUMN "insuranceProvider" TEXT,
ADD COLUMN "guardianId" TEXT;

CREATE INDEX "Patient_guardianId_idx" ON "Patient"("guardianId");

ALTER TABLE "Patient"
ADD CONSTRAINT "Patient_guardianId_fkey"
FOREIGN KEY ("guardianId") REFERENCES "Patient"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
