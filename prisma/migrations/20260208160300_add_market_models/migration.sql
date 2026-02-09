-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reasonRank" REAL NOT NULL DEFAULT 0.0,
    "truthScore" REAL NOT NULL DEFAULT 0.0,
    "logicalValidity" REAL NOT NULL DEFAULT 0.0,
    "evidenceQuality" REAL NOT NULL DEFAULT 0.0,
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "LiquidityPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "yesShares" REAL NOT NULL DEFAULT 1000.0,
    "noShares" REAL NOT NULL DEFAULT 1000.0,
    "constantProduct" REAL NOT NULL DEFAULT 1000000.0,
    "totalVolume" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LiquidityPool_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "shareType" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "avgPurchasePrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Share_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "shareType" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "pricePerShare" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trade_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "currentBalance" REAL NOT NULL DEFAULT 10000.0,
    "totalInvested" REAL NOT NULL DEFAULT 0.0,
    "realizedPnl" REAL NOT NULL DEFAULT 0.0,
    "roi" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SubArgument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "logicalValidity" REAL NOT NULL DEFAULT 0.0,
    "evidenceQuality" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubArgument_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaimEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "subArgumentId" TEXT,
    "sourceUrl" TEXT,
    "sourceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reliabilityScore" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClaimEvidence_subArgumentId_fkey" FOREIGN KEY ("subArgumentId") REFERENCES "SubArgument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkageVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "direction" TEXT,
    "isRelevant" BOOLEAN,
    "strength" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkageVote_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Argument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentBeliefId" INTEGER NOT NULL,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "linkageScore" REAL NOT NULL DEFAULT 0.1,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "linkageType" TEXT NOT NULL DEFAULT 'ANECDOTAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Argument_parentBeliefId_fkey" FOREIGN KEY ("parentBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Argument_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Argument" ("beliefId", "createdAt", "id", "impactScore", "linkageScore", "parentBeliefId", "side", "updatedAt") SELECT "beliefId", "createdAt", "id", "impactScore", "linkageScore", "parentBeliefId", "side", "updatedAt" FROM "Argument";
DROP TABLE "Argument";
ALTER TABLE "new_Argument" RENAME TO "Argument";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_reasonRank_idx" ON "Claim"("reasonRank");

-- CreateIndex
CREATE INDEX "Claim_category_idx" ON "Claim"("category");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_claimId_key" ON "LiquidityPool"("claimId");

-- CreateIndex
CREATE INDEX "Share_userId_idx" ON "Share"("userId");

-- CreateIndex
CREATE INDEX "Share_claimId_idx" ON "Share"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "Share_userId_claimId_shareType_key" ON "Share"("userId", "claimId", "shareType");

-- CreateIndex
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");

-- CreateIndex
CREATE INDEX "Trade_claimId_idx" ON "Trade"("claimId");

-- CreateIndex
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "SubArgument_claimId_idx" ON "SubArgument"("claimId");

-- CreateIndex
CREATE INDEX "ClaimEvidence_claimId_idx" ON "ClaimEvidence"("claimId");

-- CreateIndex
CREATE INDEX "ClaimEvidence_subArgumentId_idx" ON "ClaimEvidence"("subArgumentId");

-- CreateIndex
CREATE INDEX "LinkageVote_argumentId_idx" ON "LinkageVote"("argumentId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkageVote_argumentId_userId_key" ON "LinkageVote"("argumentId", "userId");
