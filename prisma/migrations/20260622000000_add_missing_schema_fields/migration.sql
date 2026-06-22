-- Add columns that exist in schema.prisma but were missing from migration history.
-- Produced by comparing schema drift via `prisma migrate dev --create-only`.

-- Belief: falsifiability, interpretation, and relationship fields
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityConfirm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityFalsify" TEXT;
ALTER TABLE "Belief" ADD COLUMN "netInterpretation" TEXT;
ALTER TABLE "Belief" ADD COLUMN "relatedBeliefs" TEXT;
ALTER TABLE "Belief" ADD COLUMN "supportsBeliefs" TEXT;

-- Compromise: synthesis and context fields
ALTER TABLE "Compromise" ADD COLUMN "sharedPremise" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "synthesis" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "whyDifficult" TEXT;

-- InterestsAnalysis: primary pair fields
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponent" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentDrives" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentValidity" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporter" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterDrives" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterValidity" TEXT;

-- ObjectiveCriteria: measurement fields
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "currentStatus" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "howToMeasure" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "target" TEXT;

-- ValuesAnalysis: divergence and shift fields
ALTER TABLE "ValuesAnalysis" ADD COLUMN "opposingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "supportingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "whatWouldShift" TEXT;

-- Argument: index on importanceBeliefId (column added in prior migration, index was missing)
CREATE INDEX IF NOT EXISTS "Argument_importanceBeliefId_idx" ON "Argument"("importanceBeliefId");

-- New tables for interest/value debate
CREATE TABLE IF NOT EXISTS "DisputeType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "disputeType" TEXT NOT NULL,
    "description" TEXT,
    "examples" TEXT,
    "resolutionPath" TEXT,
    CONSTRAINT "DisputeType_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "DisputeType_beliefId_idx" ON "DisputeType"("beliefId");

CREATE TABLE IF NOT EXISTS "InterestEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "stakeholder" TEXT NOT NULL,
    "underlyingInterest" TEXT NOT NULL,
    "howBeliefServes" TEXT,
    "legitimacy" TEXT,
    CONSTRAINT "InterestEntry_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "InterestEntry_beliefId_idx" ON "InterestEntry"("beliefId");

CREATE TABLE IF NOT EXISTS "SharedInterest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "interest" TEXT NOT NULL,
    "supporterAngle" TEXT,
    "opponentAngle" TEXT,
    CONSTRAINT "SharedInterest_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "SharedInterest_beliefId_idx" ON "SharedInterest"("beliefId");

CREATE TABLE IF NOT EXISTS "ValueRanking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "whyHigher" TEXT,
    CONSTRAINT "ValueRanking_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ValueRanking_beliefId_idx" ON "ValueRanking"("beliefId");
