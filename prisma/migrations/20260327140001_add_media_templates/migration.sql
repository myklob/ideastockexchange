-- AlterTable
ALTER TABLE "Belief" ADD COLUMN "falsifiability" TEXT;

-- CreateTable
CREATE TABLE "CBAAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalExpectedBenefits" REAL NOT NULL DEFAULT 0,
    "totalExpectedCosts" REAL NOT NULL DEFAULT 0,
    "netExpectedValue" REAL NOT NULL DEFAULT 0,
    "verdict" TEXT NOT NULL DEFAULT 'uncertain',
    "confidence" REAL NOT NULL DEFAULT 0.3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CBAImpact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "canonicalCategory" TEXT NOT NULL DEFAULT 'Financial',
    "category" TEXT NOT NULL DEFAULT 'Financial',
    "magnitude" REAL NOT NULL,
    "magnitudeJustification" TEXT,
    "likelihoodScore" REAL NOT NULL DEFAULT 0.5,
    "expectedValue" REAL NOT NULL DEFAULT 0,
    "confidence" REAL NOT NULL DEFAULT 0.3,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CBAImpact_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CBAAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CBAArgument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "impactId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "truthScore" REAL NOT NULL DEFAULT 5,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "importanceScore" REAL NOT NULL DEFAULT 1.0,
    "score" REAL NOT NULL DEFAULT 0,
    "evidenceTier" TEXT NOT NULL DEFAULT 'T3',
    "redundancyDiscount" REAL,
    "parentId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CBAArgument_impactId_fkey" FOREIGN KEY ("impactId") REFERENCES "CBAImpact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CBAArgument_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CBAArgument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CBAOverlapAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "impactId" TEXT NOT NULL,
    "overlapsWith" TEXT NOT NULL,
    "similarity" REAL NOT NULL,
    "adjustmentApplied" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CBAOverlapAdjustment_impactId_fkey" FOREIGN KEY ("impactId") REFERENCES "CBAImpact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CBASensitivityItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "impactId" TEXT NOT NULL,
    "impactTitle" TEXT NOT NULL,
    "swing" REAL NOT NULL,
    "likelihoodLow" REAL NOT NULL,
    "likelihoodHigh" REAL NOT NULL,
    CONSTRAINT "CBASensitivityItem_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CBAAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CBADeduplicationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "similarity" REAL NOT NULL,
    "adjustment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CBADeduplicationLog_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CBAAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaQualityArgument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mediaResourceId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "argumentScore" REAL NOT NULL DEFAULT 0,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaQualityArgument_mediaResourceId_fkey" FOREIGN KEY ("mediaResourceId") REFERENCES "MediaResource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Definition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Definition_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestablePrediction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "prediction" TEXT NOT NULL,
    "timeframe" TEXT,
    "verificationMethod" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestablePrediction_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquivalenceAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "beliefXRaw" TEXT NOT NULL,
    "beliefXNormalized" TEXT,
    "beliefXSource" TEXT,
    "beliefYRaw" TEXT NOT NULL,
    "beliefYNormalized" TEXT,
    "beliefYSource" TEXT,
    "fastPathPassed" BOOLEAN NOT NULL DEFAULT false,
    "autoMerge" BOOLEAN NOT NULL DEFAULT false,
    "synonymConvergenceScore" REAL NOT NULL DEFAULT 0,
    "certaintyDeltaX" TEXT,
    "certaintyDeltaY" TEXT,
    "certaintyDelta" REAL NOT NULL DEFAULT 0,
    "scopeDeltaX" TEXT,
    "scopeDeltaY" TEXT,
    "scopeDelta" REAL NOT NULL DEFAULT 0,
    "forceDeltaX" TEXT,
    "forceDeltaY" TEXT,
    "forceDelta" REAL NOT NULL DEFAULT 0,
    "overallStrengthDelta" REAL NOT NULL DEFAULT 0,
    "structuralRelationship" TEXT NOT NULL DEFAULT 'same_topic_different_claim',
    "subjectOverlap" REAL NOT NULL DEFAULT 0,
    "predicateOverlap" REAL NOT NULL DEFAULT 0,
    "contextOverlap" REAL NOT NULL DEFAULT 0,
    "mechanismOverlap" REAL NOT NULL DEFAULT 0,
    "overlapScore" REAL NOT NULL DEFAULT 0,
    "penaltyDifferentCausal" REAL NOT NULL DEFAULT 0,
    "penaltyDifferentEvidence" REAL NOT NULL DEFAULT 0,
    "penaltyDifferentAssumptions" REAL NOT NULL DEFAULT 0,
    "penaltyDifferentPolicy" REAL NOT NULL DEFAULT 0,
    "totalPenalty" REAL NOT NULL DEFAULT 0,
    "proEquivalenceScore" REAL NOT NULL DEFAULT 0,
    "antiEquivalenceScore" REAL NOT NULL DEFAULT 0,
    "argumentBalance" REAL NOT NULL DEFAULT 0,
    "evidenceArgumentOverlapRate" REAL NOT NULL DEFAULT 0,
    "networkAdjustment" REAL NOT NULL DEFAULT 0,
    "finalEquivalenceScore" REAL NOT NULL DEFAULT 0,
    "verdict" TEXT NOT NULL DEFAULT 'separate',
    "canonicalPage" TEXT,
    "linkageScore" REAL NOT NULL DEFAULT 0,
    "analystType" TEXT NOT NULL DEFAULT 'human',
    "analystId" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "reviewedBy" TEXT,
    "reviewDate" DATETIME,
    "triggerReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "revisedFromId" INTEGER,
    CONSTRAINT "EquivalenceAnalysis_revisedFromId_fkey" FOREIGN KEY ("revisedFromId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SynonymClaim" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "analysisId" INTEGER NOT NULL,
    "xTerm" TEXT NOT NULL,
    "yTerm" TEXT NOT NULL,
    "merriamWebster" BOOLEAN,
    "oxford" BOOLEAN,
    "wordNet" BOOLEAN,
    "embeddingModel" BOOLEAN,
    "agreementNumerator" INTEGER NOT NULL DEFAULT 0,
    "agreementDenominator" INTEGER NOT NULL DEFAULT 4,
    "agreementRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SynonymClaim_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemanticMapEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "analysisId" INTEGER NOT NULL,
    "xElement" TEXT NOT NULL,
    "yElement" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'different',
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemanticMapEntry_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquivalenceReason" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "analysisId" INTEGER NOT NULL,
    "reasonType" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "truthScore" REAL NOT NULL DEFAULT 0.5,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "importanceScore" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquivalenceReason_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquivalenceReason_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquivalenceReason_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EquivalenceReason_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArgumentBattleItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "analysisId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "truthScore" REAL NOT NULL DEFAULT 0.5,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "importanceScore" REAL NOT NULL DEFAULT 0.5,
    "contributionScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArgumentBattleItem_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NetworkPosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "analysisId" INTEGER NOT NULL,
    "positionType" TEXT NOT NULL,
    "beliefXItems" TEXT NOT NULL DEFAULT '[]',
    "beliefYItems" TEXT NOT NULL DEFAULT '[]',
    "overlapPercent" REAL NOT NULL DEFAULT 0,
    "sameCluster" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NetworkPosition_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "EquivalenceAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MediaResource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "url" TEXT,
    "year" INTEGER,
    "truthScore" REAL NOT NULL DEFAULT 0.5,
    "genreScore" REAL NOT NULL DEFAULT 0.5,
    "genreType" TEXT NOT NULL DEFAULT 'unknown',
    "reliabilityTier" TEXT NOT NULL DEFAULT 'T3',
    "qualityScore" REAL NOT NULL DEFAULT 0.5,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "impactScore" REAL NOT NULL DEFAULT 0.5,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "directnessOfAdvocacy" INTEGER NOT NULL DEFAULT 50,
    "howItArgues" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaResource_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MediaResource" ("author", "beliefId", "createdAt", "genreScore", "genreType", "id", "mediaType", "reliabilityTier", "side", "title", "truthScore", "url") SELECT "author", "beliefId", "createdAt", "genreScore", "genreType", "id", "mediaType", "reliabilityTier", "side", "title", "truthScore", "url" FROM "MediaResource";
DROP TABLE "MediaResource";
ALTER TABLE "new_MediaResource" RENAME TO "MediaResource";
CREATE INDEX "MediaResource_beliefId_idx" ON "MediaResource"("beliefId");
CREATE INDEX "MediaResource_mediaType_idx" ON "MediaResource"("mediaType");
CREATE INDEX "MediaResource_qualityScore_idx" ON "MediaResource"("qualityScore");
CREATE INDEX "MediaResource_reach_idx" ON "MediaResource"("reach");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CBAImpact_analysisId_idx" ON "CBAImpact"("analysisId");

-- CreateIndex
CREATE INDEX "CBAImpact_direction_idx" ON "CBAImpact"("direction");

-- CreateIndex
CREATE INDEX "CBAImpact_canonicalCategory_idx" ON "CBAImpact"("canonicalCategory");

-- CreateIndex
CREATE INDEX "CBAArgument_impactId_idx" ON "CBAArgument"("impactId");

-- CreateIndex
CREATE INDEX "CBAArgument_side_idx" ON "CBAArgument"("side");

-- CreateIndex
CREATE INDEX "CBAArgument_parentId_idx" ON "CBAArgument"("parentId");

-- CreateIndex
CREATE INDEX "CBAOverlapAdjustment_impactId_idx" ON "CBAOverlapAdjustment"("impactId");

-- CreateIndex
CREATE INDEX "CBASensitivityItem_analysisId_idx" ON "CBASensitivityItem"("analysisId");

-- CreateIndex
CREATE INDEX "CBADeduplicationLog_analysisId_idx" ON "CBADeduplicationLog"("analysisId");

-- CreateIndex
CREATE INDEX "MediaQualityArgument_mediaResourceId_idx" ON "MediaQualityArgument"("mediaResourceId");

-- CreateIndex
CREATE INDEX "Definition_beliefId_idx" ON "Definition"("beliefId");

-- CreateIndex
CREATE INDEX "TestablePrediction_beliefId_idx" ON "TestablePrediction"("beliefId");

-- CreateIndex
CREATE UNIQUE INDEX "EquivalenceAnalysis_slug_key" ON "EquivalenceAnalysis"("slug");

-- CreateIndex
CREATE INDEX "EquivalenceAnalysis_finalEquivalenceScore_idx" ON "EquivalenceAnalysis"("finalEquivalenceScore");

-- CreateIndex
CREATE INDEX "EquivalenceAnalysis_verdict_idx" ON "EquivalenceAnalysis"("verdict");

-- CreateIndex
CREATE INDEX "SynonymClaim_analysisId_idx" ON "SynonymClaim"("analysisId");

-- CreateIndex
CREATE INDEX "SemanticMapEntry_analysisId_idx" ON "SemanticMapEntry"("analysisId");

-- CreateIndex
CREATE INDEX "EquivalenceReason_analysisId_idx" ON "EquivalenceReason"("analysisId");

-- CreateIndex
CREATE INDEX "EquivalenceReason_reasonType_idx" ON "EquivalenceReason"("reasonType");

-- CreateIndex
CREATE INDEX "ArgumentBattleItem_analysisId_idx" ON "ArgumentBattleItem"("analysisId");

-- CreateIndex
CREATE INDEX "NetworkPosition_analysisId_idx" ON "NetworkPosition"("analysisId");
