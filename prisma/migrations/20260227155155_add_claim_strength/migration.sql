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
    "importanceScore" REAL NOT NULL DEFAULT 1.0,
    "linkageType" TEXT NOT NULL DEFAULT 'ANECDOTAL',
    "linkageScoreType" TEXT NOT NULL DEFAULT 'ACLS',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Argument_parentBeliefId_fkey" FOREIGN KEY ("parentBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Argument_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Argument" ("beliefId", "createdAt", "id", "impactScore", "importanceScore", "linkageScore", "linkageType", "parentBeliefId", "side", "updatedAt") SELECT "beliefId", "createdAt", "id", "impactScore", "importanceScore", "linkageScore", "linkageType", "parentBeliefId", "side", "updatedAt" FROM "Argument";
DROP TABLE "Argument";
ALTER TABLE "new_Argument" RENAME TO "Argument";
CREATE TABLE "new_Belief" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "deweyNumber" TEXT,
    "positivity" REAL NOT NULL DEFAULT 0,
    "stabilityScore" REAL NOT NULL DEFAULT 0.5,
    "claimStrength" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Belief" ("category", "createdAt", "deweyNumber", "id", "positivity", "slug", "stabilityScore", "statement", "subcategory", "updatedAt") SELECT "category", "createdAt", "deweyNumber", "id", "positivity", "slug", "stabilityScore", "statement", "subcategory", "updatedAt" FROM "Belief";
DROP TABLE "Belief";
ALTER TABLE "new_Belief" RENAME TO "Belief";
CREATE UNIQUE INDEX "Belief_slug_key" ON "Belief"("slug");
CREATE TABLE "new_Evidence" (
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
    "evsScore" REAL NOT NULL DEFAULT 0.0,
    "linkageScoreType" TEXT NOT NULL DEFAULT 'ECLS',
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evidence_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Evidence" ("beliefId", "conclusionRelevance", "createdAt", "description", "evidenceType", "evsScore", "id", "impactScore", "linkageScore", "replicationPercentage", "replicationQuantity", "side", "sourceIndependenceWeight", "sourceUrl", "updatedAt") SELECT "beliefId", "conclusionRelevance", "createdAt", "description", "evidenceType", "evsScore", "id", "impactScore", "linkageScore", "replicationPercentage", "replicationQuantity", "side", "sourceIndependenceWeight", "sourceUrl", "updatedAt" FROM "Evidence";
DROP TABLE "Evidence";
ALTER TABLE "new_Evidence" RENAME TO "Evidence";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
