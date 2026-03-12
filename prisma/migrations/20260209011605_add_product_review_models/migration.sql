-- CreateTable
CREATE TABLE "ProductReview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "categoryType" TEXT NOT NULL,
    "categorySubtype" TEXT,
    "overallScore" REAL NOT NULL DEFAULT 0,
    "categoryRank" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "beliefId" INTEGER,
    CONSTRAINT "ProductReview_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductPerformance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "criterion" TEXT NOT NULL,
    "measurement" TEXT NOT NULL,
    "evidenceTier" INTEGER NOT NULL DEFAULT 3,
    "comparisonToAvg" TEXT NOT NULL DEFAULT 'Same',
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductPerformance_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductTradeoff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductTradeoff_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductAlternative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "alternativeName" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "keyAdvantage" TEXT NOT NULL,
    "linkSlug" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductAlternative_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductUserProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductUserProfile_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductAward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductAward_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductEcosystem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productReviewId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductEcosystem_productReviewId_fkey" FOREIGN KEY ("productReviewId") REFERENCES "ProductReview" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_slug_key" ON "ProductReview"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_beliefId_key" ON "ProductReview"("beliefId");

-- CreateIndex
CREATE INDEX "ProductReview_categoryType_idx" ON "ProductReview"("categoryType");

-- CreateIndex
CREATE INDEX "ProductReview_overallScore_idx" ON "ProductReview"("overallScore");

-- CreateIndex
CREATE INDEX "ProductReview_brand_idx" ON "ProductReview"("brand");

-- CreateIndex
CREATE INDEX "ProductPerformance_productReviewId_idx" ON "ProductPerformance"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductTradeoff_productReviewId_idx" ON "ProductTradeoff"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductAlternative_productReviewId_idx" ON "ProductAlternative"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductUserProfile_productReviewId_idx" ON "ProductUserProfile"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductAward_productReviewId_idx" ON "ProductAward"("productReviewId");

-- CreateIndex
CREATE INDEX "ProductEcosystem_productReviewId_idx" ON "ProductEcosystem"("productReviewId");
