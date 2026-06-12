-- Add two-sided falsifiability fields and net score interpretation to Belief.
-- These columns were added via db push in dev but were never captured in a migration.
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityConfirm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityFalsify" TEXT;
ALTER TABLE "Belief" ADD COLUMN "netInterpretation" TEXT;
