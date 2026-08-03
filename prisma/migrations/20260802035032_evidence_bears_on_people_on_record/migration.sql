-- CreateTable
CREATE TABLE "PersonOnRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "contested" BOOLEAN NOT NULL DEFAULT false,
    "contestedNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonOnRecord_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evidence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "evidenceType" TEXT NOT NULL DEFAULT 'T3',
    "producer" TEXT,
    "year" INTEGER,
    "bearsOnArgumentId" INTEGER,
    "sourceIndependenceWeight" REAL NOT NULL DEFAULT 0.5,
    "replicationQuantity" INTEGER NOT NULL DEFAULT 1,
    "conclusionRelevance" REAL NOT NULL DEFAULT 0.5,
    "replicationPercentage" REAL NOT NULL DEFAULT 1.0,
    "evsScore" REAL NOT NULL DEFAULT 0.0,
    "linkageScoreType" TEXT NOT NULL DEFAULT 'ECLS',
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "doi" TEXT,
    "pmid" TEXT,
    "isbn" TEXT,
    "author" TEXT,
    "publicationDate" TEXT,
    "tierClaim" TEXT,
    "tierVerified" TEXT,
    "retrievedByAgentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evidence_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evidence_bearsOnArgumentId_fkey" FOREIGN KEY ("bearsOnArgumentId") REFERENCES "Argument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Evidence_retrievedByAgentId_fkey" FOREIGN KEY ("retrievedByAgentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Evidence" ("author", "beliefId", "conclusionRelevance", "createdAt", "description", "doi", "evidenceType", "evsScore", "id", "impactScore", "isbn", "linkageScore", "linkageScoreType", "pmid", "publicationDate", "replicationPercentage", "replicationQuantity", "retrievedByAgentId", "side", "sourceIndependenceWeight", "sourceUrl", "tierClaim", "tierVerified", "updatedAt") SELECT "author", "beliefId", "conclusionRelevance", "createdAt", "description", "doi", "evidenceType", "evsScore", "id", "impactScore", "isbn", "linkageScore", "linkageScoreType", "pmid", "publicationDate", "replicationPercentage", "replicationQuantity", "retrievedByAgentId", "side", "sourceIndependenceWeight", "sourceUrl", "tierClaim", "tierVerified", "updatedAt" FROM "Evidence";
DROP TABLE "Evidence";
ALTER TABLE "new_Evidence" RENAME TO "Evidence";
CREATE INDEX "Evidence_retrievedByAgentId_idx" ON "Evidence"("retrievedByAgentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PersonOnRecord_beliefId_idx" ON "PersonOnRecord"("beliefId");
