-- Add missing columns to Argument table (label, quote, score fields)
ALTER TABLE "Argument" ADD COLUMN "claim" TEXT;
ALTER TABLE "Argument" ADD COLUMN "famousQuote" TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthor" TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthorUrl" TEXT;
ALTER TABLE "Argument" ADD COLUMN "argumentScore" REAL;

-- Add missing columns to Belief table (falsifiability, interpretation, header metadata)
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityConfirm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityFalsify" TEXT;
ALTER TABLE "Belief" ADD COLUMN "netInterpretation" TEXT;
ALTER TABLE "Belief" ADD COLUMN "relatedBeliefs" TEXT;
ALTER TABLE "Belief" ADD COLUMN "supportsBeliefs" TEXT;

-- Add missing columns to ObjectiveCriteria (how measured, current status, target threshold)
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "howToMeasure" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "currentStatus" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "target" TEXT;

-- Add missing columns to ValuesAnalysis (divergence evidence, shift prompt)
ALTER TABLE "ValuesAnalysis" ADD COLUMN "supportingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "opposingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "whatWouldShift" TEXT;

-- Add missing columns to InterestsAnalysis (primary conflict pair, new template)
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporter" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterValidity" INTEGER;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterDrives" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponent" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentValidity" INTEGER;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentDrives" TEXT;

-- Add missing columns to Compromise (best compromise solution three-column form)
ALTER TABLE "Compromise" ADD COLUMN "sharedPremise" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "synthesis" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "whyDifficult" TEXT;

-- CreateTable: ValueRanking (Shared Values, Different Rankings rows)
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
CREATE INDEX "ValueRanking_beliefId_idx" ON "ValueRanking"("beliefId");

-- CreateTable: InterestEntry (Likely Interests of Supporters / Opponents rows)
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
CREATE INDEX "InterestEntry_beliefId_idx" ON "InterestEntry"("beliefId");

-- CreateTable: SharedInterest (Shared Interests table rows)
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
CREATE INDEX "SharedInterest_beliefId_idx" ON "SharedInterest"("beliefId");

-- CreateTable: DisputeType (Dispute Types table rows: Empirical / Definitional / Values)
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
CREATE INDEX "DisputeType_beliefId_idx" ON "DisputeType"("beliefId");
