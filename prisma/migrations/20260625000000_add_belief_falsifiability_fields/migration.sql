-- AlterTable Belief
-- Add falsifiability confirm/falsify fields, net score interpretation, and header metadata.
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityConfirm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityFalsify" TEXT;
ALTER TABLE "Belief" ADD COLUMN "netInterpretation" TEXT;
ALTER TABLE "Belief" ADD COLUMN "relatedBeliefs" TEXT;
ALTER TABLE "Belief" ADD COLUMN "supportsBeliefs" TEXT;

-- AlterTable Argument
-- Add argument label, quote, and score fields from the belief-analysis template v2.
ALTER TABLE "Argument" ADD COLUMN "claim" TEXT;
ALTER TABLE "Argument" ADD COLUMN "famousQuote" TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthor" TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthorUrl" TEXT;
ALTER TABLE "Argument" ADD COLUMN "argumentScore" REAL;

-- CreateTable ValueRanking
-- Rows in the Values table (supporter/opponent value rankings, new template).
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
-- Rows in the Likely Interests of Supporters / Opponents tables (new template).
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
-- Rows in the Shared Interests table (foundation for compromise, new template).
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
-- Rows in the Dispute Types table: Empirical / Definitional / Values (new template).
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
