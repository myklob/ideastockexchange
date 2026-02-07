-- CreateTable
CREATE TABLE "Belief" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "deweyNumber" TEXT,
    "positivity" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Argument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentBeliefId" INTEGER NOT NULL,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Argument_parentBeliefId_fkey" FOREIGN KEY ("parentBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Argument_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkageArgument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkageArgument_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "evidenceType" TEXT NOT NULL DEFAULT 'T3',
    "sourceIndependenceWeight" REAL NOT NULL DEFAULT 0.5,
    "replicationQuantity" INTEGER NOT NULL DEFAULT 1,
    "conclusionRelevance" REAL NOT NULL DEFAULT 0.5,
    "replicationPercentage" REAL NOT NULL DEFAULT 1.0,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evidence_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObjectiveCriteria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "independenceScore" REAL NOT NULL DEFAULT 0.5,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "criteriaType" TEXT,
    "totalScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObjectiveCriteria_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValuesAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "supportingAdvertised" TEXT,
    "supportingActual" TEXT,
    "opposingAdvertised" TEXT,
    "opposingActual" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ValuesAnalysis_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterestsAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "supporterInterests" TEXT,
    "opponentInterests" TEXT,
    "sharedInterests" TEXT,
    "conflictingInterests" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterestsAnalysis_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assumption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "strength" TEXT NOT NULL DEFAULT 'MODERATE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assumption_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostBenefitAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "benefits" TEXT,
    "benefitLikelihood" REAL,
    "costs" TEXT,
    "costLikelihood" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CostBenefitAnalysis_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImpactAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "shortTermEffects" TEXT,
    "shortTermCosts" TEXT,
    "longTermEffects" TEXT,
    "longTermChanges" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImpactAnalysis_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Compromise" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Compromise_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Obstacle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Obstacle_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BiasEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "biasType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BiasEntry_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaResource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaResource_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LegalEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LegalEntry_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BeliefMapping" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentBeliefId" INTEGER NOT NULL,
    "childBeliefId" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BeliefMapping_parentBeliefId_fkey" FOREIGN KEY ("parentBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BeliefMapping_childBeliefId_fkey" FOREIGN KEY ("childBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SimilarBelief" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fromBeliefId" INTEGER NOT NULL,
    "toBeliefId" INTEGER NOT NULL,
    "variant" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimilarBelief_fromBeliefId_fkey" FOREIGN KEY ("fromBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SimilarBelief_toBeliefId_fkey" FOREIGN KEY ("toBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Belief_slug_key" ON "Belief"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ValuesAnalysis_beliefId_key" ON "ValuesAnalysis"("beliefId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestsAnalysis_beliefId_key" ON "InterestsAnalysis"("beliefId");

-- CreateIndex
CREATE UNIQUE INDEX "CostBenefitAnalysis_beliefId_key" ON "CostBenefitAnalysis"("beliefId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactAnalysis_beliefId_key" ON "ImpactAnalysis"("beliefId");
