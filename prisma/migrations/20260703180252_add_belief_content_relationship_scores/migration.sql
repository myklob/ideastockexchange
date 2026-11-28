-- AlterTable
ALTER TABLE "Assumption" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "Belief" ADD COLUMN "bottomLine" TEXT;
ALTER TABLE "Belief" ADD COLUMN "logicalForm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "scoreMover" TEXT;

-- AlterTable
ALTER TABLE "BeliefMapping" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "BiasEntry" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "Compromise" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "Definition" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "DisputeType" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "InterestEntry" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "LegalEntry" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "strengthenReading" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "weakenReading" TEXT;

-- AlterTable
ALTER TABLE "Obstacle" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "SharedInterest" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "ValueRanking" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "ValuesAnalysis" ADD COLUMN "opposingDivergenceScore" REAL;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "supportingDivergenceScore" REAL;

-- CreateTable
CREATE TABLE "ComponentClaim" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "claim" TEXT NOT NULL,
    "claimType" TEXT,
    "stated" BOOLEAN NOT NULL DEFAULT true,
    "survivesWithout" BOOLEAN,
    "unstatedAssumptions" TEXT,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComponentClaim_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FalsifiabilityItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FalsifiabilityItem_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostBenefitItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "claimBeliefId" INTEGER,
    "category" TEXT,
    "magnitude" REAL,
    "likelihood" REAL,
    "expectedValue" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostBenefitItem_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CostBenefitItem_claimBeliefId_fkey" FOREIGN KEY ("claimBeliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImpactEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImpactEntry_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestablePrediction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "prediction" TEXT NOT NULL,
    "timeframe" TEXT,
    "verificationMethod" TEXT,
    "followsIf" TEXT NOT NULL DEFAULT 'true',
    "resultSoFar" TEXT,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestablePrediction_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TestablePrediction" ("beliefId", "createdAt", "id", "prediction", "sortOrder", "timeframe", "verificationMethod") SELECT "beliefId", "createdAt", "id", "prediction", "sortOrder", "timeframe", "verificationMethod" FROM "TestablePrediction";
DROP TABLE "TestablePrediction";
ALTER TABLE "new_TestablePrediction" RENAME TO "TestablePrediction";
CREATE INDEX "TestablePrediction_beliefId_idx" ON "TestablePrediction"("beliefId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ComponentClaim_beliefId_idx" ON "ComponentClaim"("beliefId");

-- CreateIndex
CREATE INDEX "FalsifiabilityItem_beliefId_idx" ON "FalsifiabilityItem"("beliefId");

-- CreateIndex
CREATE INDEX "CostBenefitItem_beliefId_idx" ON "CostBenefitItem"("beliefId");

-- CreateIndex
CREATE INDEX "CostBenefitItem_claimBeliefId_idx" ON "CostBenefitItem"("claimBeliefId");

-- CreateIndex
CREATE INDEX "ImpactEntry_beliefId_idx" ON "ImpactEntry"("beliefId");
