-- AlterTable
-- Add structured Falsifiability Test fields split from legacy single-field "falsifiability".
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityConfirm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityFalsify" TEXT;
