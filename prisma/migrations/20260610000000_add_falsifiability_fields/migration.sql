-- AlterTable Compromise
-- Three-column Best Compromise Solutions fields (new template).
ALTER TABLE "Compromise" ADD COLUMN "sharedPremise" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "synthesis" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "whyDifficult" TEXT;

-- AlterTable Belief
-- Structured falsifiability fields, net interpretation, and header metadata.
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityConfirm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityFalsify" TEXT;
ALTER TABLE "Belief" ADD COLUMN "netInterpretation" TEXT;
ALTER TABLE "Belief" ADD COLUMN "relatedBeliefs" TEXT;
ALTER TABLE "Belief" ADD COLUMN "supportsBeliefs" TEXT;

-- AlterTable Argument
-- Short argument label, famous quote display fields, and optional argument score.
ALTER TABLE "Argument" ADD COLUMN "claim" TEXT;
ALTER TABLE "Argument" ADD COLUMN "famousQuote" TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthor" TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthorUrl" TEXT;
ALTER TABLE "Argument" ADD COLUMN "argumentScore" REAL;

-- AlterTable ObjectiveCriteria
-- Measurement guidance and status tracking fields.
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "howToMeasure" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "currentStatus" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "target" TEXT;

-- AlterTable ValuesAnalysis
-- Divergence evidence fields for supporter/opponent value analysis.
ALTER TABLE "ValuesAnalysis" ADD COLUMN "supportingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "opposingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "whatWouldShift" TEXT;

-- AlterTable InterestsAnalysis
-- Primary supporter/opponent pair fields for interests analysis.
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporter" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterValidity" INTEGER;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterDrives" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponent" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentValidity" INTEGER;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentDrives" TEXT;

-- CreateTable ValueRanking
CREATE TABLE "ValueRanking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "supporterRank" INTEGER,
    "opponentRank" INTEGER,
    "whyDiffer" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValueRanking_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ValueRanking_beliefId_idx" ON "ValueRanking"("beliefId");

-- CreateTable InterestEntry
CREATE TABLE "InterestEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "prevalence" TEXT,
    "linkageConfidence" TEXT,
    "validity" TEXT,
    "evidenceBasis" TEXT,
    "connectedValue" TEXT,
    "pretextual" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterestEntry_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InterestEntry_beliefId_idx" ON "InterestEntry"("beliefId");

-- CreateTable SharedInterest
CREATE TABLE "SharedInterest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "interest" TEXT NOT NULL,
    "validity" TEXT,
    "compromiseDirection" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedInterest_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SharedInterest_beliefId_idx" ON "SharedInterest"("beliefId");

-- CreateTable DisputeType
CREATE TABLE "DisputeType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "disputeType" TEXT NOT NULL,
    "disagreement" TEXT,
    "evidenceThatMoves" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisputeType_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DisputeType_beliefId_idx" ON "DisputeType"("beliefId");
