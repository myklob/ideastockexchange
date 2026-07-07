-- AlterTable: the evidence verification lifecycle. The engine multiplies each
-- evidence impact by a status factor (VERIFIED 1.0, UNVERIFIED/DISPUTED 0.5,
-- FALSIFIED 0), so a retraction lowers every score that leaned on the row.
ALTER TABLE "Evidence" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED';
