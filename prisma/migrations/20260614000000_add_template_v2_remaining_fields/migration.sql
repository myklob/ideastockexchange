-- AlterTable
ALTER TABLE "Compromise" ADD COLUMN "sharedPremise" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "synthesis" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "whyDifficult" TEXT;

-- AlterTable
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponent" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentDrives" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentValidity" INTEGER;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporter" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterDrives" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterValidity" INTEGER;

-- AlterTable
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "currentStatus" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "howToMeasure" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "target" TEXT;

-- AlterTable
ALTER TABLE "ValuesAnalysis" ADD COLUMN "opposingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "supportingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "whatWouldShift" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Argument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentBeliefId" INTEGER NOT NULL,
    "beliefId" INTEGER NOT NULL,
    "importanceBeliefId" INTEGER,
    "side" TEXT NOT NULL,
    "linkageScore" REAL NOT NULL DEFAULT 0.1,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "claim" TEXT,
    "famousQuote" TEXT,
    "quoteAuthor" TEXT,
    "quoteAuthorUrl" TEXT,
    "argumentScore" REAL,
    "importanceScore" REAL NOT NULL DEFAULT 1.0,
    "linkageType" TEXT NOT NULL DEFAULT 'ANECDOTAL',
    "linkageScoreType" TEXT NOT NULL DEFAULT 'ACLS',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Argument_parentBeliefId_fkey" FOREIGN KEY ("parentBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Argument_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Argument_importanceBeliefId_fkey" FOREIGN KEY ("importanceBeliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Argument" ("argumentScore", "beliefId", "claim", "createdAt", "depth", "famousQuote", "id", "impactScore", "importanceBeliefId", "importanceScore", "linkageScore", "linkageScoreType", "linkageType", "parentBeliefId", "quoteAuthor", "quoteAuthorUrl", "side", "updatedAt") SELECT "argumentScore", "beliefId", "claim", "createdAt", "depth", "famousQuote", "id", "impactScore", "importanceBeliefId", "importanceScore", "linkageScore", "linkageScoreType", "linkageType", "parentBeliefId", "quoteAuthor", "quoteAuthorUrl", "side", "updatedAt" FROM "Argument";
DROP TABLE "Argument";
ALTER TABLE "new_Argument" RENAME TO "Argument";
CREATE INDEX "Argument_importanceBeliefId_idx" ON "Argument"("importanceBeliefId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
