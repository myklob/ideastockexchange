-- CreateTable
CREATE TABLE "EpochSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beliefId" INTEGER NOT NULL,
    "epoch" TEXT NOT NULL,
    "truthScore" REAL NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "graphArchive" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EpochSnapshot_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketContract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beliefId" INTEGER,
    "contractType" TEXT NOT NULL DEFAULT 'SCORE',
    "thresholdValue" REAL NOT NULL,
    "direction" TEXT NOT NULL,
    "resolutionEpoch" TEXT NOT NULL,
    "creatorId" TEXT,
    "qYes" REAL NOT NULL DEFAULT 0,
    "qNo" REAL NOT NULL DEFAULT 0,
    "bParameter" REAL NOT NULL DEFAULT 100,
    "liquidityPool" REAL NOT NULL DEFAULT 0,
    "feeRate" REAL NOT NULL DEFAULT 100,
    "feesCollected" REAL NOT NULL DEFAULT 0,
    "pricingMode" TEXT NOT NULL DEFAULT 'LMSR',
    "volume" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "finalScore" REAL,
    "finalOutcome" TEXT,
    "settledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketContract_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MarketContract_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "sharesYes" REAL NOT NULL DEFAULT 0,
    "sharesNo" REAL NOT NULL DEFAULT 0,
    "avgCostYes" REAL NOT NULL DEFAULT 0,
    "avgCostNo" REAL NOT NULL DEFAULT 0,
    "realizedPnl" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketPosition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarketPosition_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MarketContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "limitPrice" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "filledQuantity" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MarketContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarketOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "buyerId" TEXT,
    "sellerId" TEXT,
    "source" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "price" REAL NOT NULL,
    "fee" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketTrade_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MarketContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarketTrade_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MarketTrade_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriceTick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "priceYes" REAL NOT NULL,
    "forecastYes" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceTick_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MarketContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketBundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketBundle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketBundleLeg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bundleId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "shares" REAL NOT NULL,
    "cost" REAL NOT NULL,
    CONSTRAINT "MarketBundleLeg_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "MarketBundle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MarketBundleLeg_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MarketContract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarginLoan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "outstanding" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarginLoan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManipulationFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ManipulationFlag_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "MarketContract" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalMarketLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beliefId" INTEGER NOT NULL,
    "venue" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalMarketLink_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "EpochSnapshot_epoch_idx" ON "EpochSnapshot"("epoch");

-- CreateIndex
CREATE UNIQUE INDEX "EpochSnapshot_beliefId_epoch_key" ON "EpochSnapshot"("beliefId", "epoch");

-- CreateIndex
CREATE INDEX "MarketContract_beliefId_idx" ON "MarketContract"("beliefId");

-- CreateIndex
CREATE INDEX "MarketContract_resolutionEpoch_idx" ON "MarketContract"("resolutionEpoch");

-- CreateIndex
CREATE INDEX "MarketContract_status_idx" ON "MarketContract"("status");

-- CreateIndex
CREATE INDEX "MarketPosition_contractId_idx" ON "MarketPosition"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPosition_userId_contractId_key" ON "MarketPosition"("userId", "contractId");

-- CreateIndex
CREATE INDEX "MarketOrder_contractId_status_idx" ON "MarketOrder"("contractId", "status");

-- CreateIndex
CREATE INDEX "MarketOrder_userId_idx" ON "MarketOrder"("userId");

-- CreateIndex
CREATE INDEX "MarketTrade_contractId_idx" ON "MarketTrade"("contractId");

-- CreateIndex
CREATE INDEX "MarketTrade_buyerId_idx" ON "MarketTrade"("buyerId");

-- CreateIndex
CREATE INDEX "MarketTrade_sellerId_idx" ON "MarketTrade"("sellerId");

-- CreateIndex
CREATE INDEX "PriceTick_contractId_createdAt_idx" ON "PriceTick"("contractId", "createdAt");

-- CreateIndex
CREATE INDEX "MarketBundleLeg_bundleId_idx" ON "MarketBundleLeg"("bundleId");

-- CreateIndex
CREATE INDEX "MarketBundleLeg_contractId_idx" ON "MarketBundleLeg"("contractId");

-- CreateIndex
CREATE INDEX "MarginLoan_userId_status_idx" ON "MarginLoan"("userId", "status");

-- CreateIndex
CREATE INDEX "ManipulationFlag_contractId_idx" ON "ManipulationFlag"("contractId");

-- CreateIndex
CREATE INDEX "ManipulationFlag_reason_idx" ON "ManipulationFlag"("reason");

-- CreateIndex
CREATE INDEX "ExternalMarketLink_beliefId_idx" ON "ExternalMarketLink"("beliefId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalMarketLink_venue_externalId_key" ON "ExternalMarketLink"("venue", "externalId");
