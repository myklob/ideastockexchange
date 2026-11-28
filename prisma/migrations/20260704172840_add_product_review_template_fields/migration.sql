-- AlterTable
ALTER TABLE "ProductAlternative" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "ProductAward" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "ProductEcosystem" ADD COLUMN "cost" TEXT;
ALTER TABLE "ProductEcosystem" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "ProductPerformance" ADD COLUMN "benchmark" TEXT;
ALTER TABLE "ProductPerformance" ADD COLUMN "impact" REAL;
ALTER TABLE "ProductPerformance" ADD COLUMN "source" TEXT;

-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN "bottomLine" TEXT;
ALTER TABLE "ProductReview" ADD COLUMN "divergenceNote" TEXT;
ALTER TABLE "ProductReview" ADD COLUMN "divergenceScore" REAL;
ALTER TABLE "ProductReview" ADD COLUMN "priceSegment" TEXT;
ALTER TABLE "ProductReview" ADD COLUMN "useCase" TEXT;
ALTER TABLE "ProductReview" ADD COLUMN "verdictChanger" TEXT;

-- AlterTable
ALTER TABLE "ProductTradeoff" ADD COLUMN "score" REAL;

-- AlterTable
ALTER TABLE "ProductUserProfile" ADD COLUMN "score" REAL;

-- CreateTable
CREATE TABLE "CategoryCriterion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryType" TEXT NOT NULL,
    "criterion" TEXT NOT NULL,
    "howToMeasure" TEXT,
    "importance" REAL,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProductRecommenderInterest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "evidence" TEXT,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductRecommenderInterest_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductOwnershipCost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "estimate" TEXT,
    "costType" TEXT NOT NULL DEFAULT 'initial',
    "source" TEXT,
    "evidenceTier" INTEGER,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductOwnershipCost_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductValueItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "measure" TEXT,
    "timeframe" TEXT NOT NULL DEFAULT 'short',
    "source" TEXT,
    "evidenceTier" INTEGER,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductValueItem_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductDecisionRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "advice" TEXT NOT NULL,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductDecisionRule_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductDecisionObstacle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductDecisionObstacle_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CategoryCriterion_categoryType_idx" ON "CategoryCriterion"("categoryType");

-- CreateIndex
CREATE INDEX "ProductRecommenderInterest_productReviewId_idx" ON "ProductRecommenderInterest"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductOwnershipCost_productReviewId_idx" ON "ProductOwnershipCost"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductValueItem_productReviewId_idx" ON "ProductValueItem"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductDecisionRule_productReviewId_idx" ON "ProductDecisionRule"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductDecisionObstacle_productReviewId_idx" ON "ProductDecisionObstacle"("productReviewId");
