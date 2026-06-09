-- AlterTable
-- Add new template fields to Belief: two-sided falsifiability test, net score
-- interpretation, and related/supports belief label lists.
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityConfirm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityFalsify" TEXT;
ALTER TABLE "Belief" ADD COLUMN "netInterpretation" TEXT;
ALTER TABLE "Belief" ADD COLUMN "relatedBeliefs" TEXT;
ALTER TABLE "Belief" ADD COLUMN "supportsBeliefs" TEXT;
