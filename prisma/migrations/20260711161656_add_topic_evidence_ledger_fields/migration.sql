-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DebateEvidence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL DEFAULT 75,
    "qualityLabel" TEXT NOT NULL DEFAULT 'Peer Reviewed',
    "url" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'T2',
    "argument" TEXT NOT NULL DEFAULT '',
    "linkage" REAL,
    "standing" TEXT NOT NULL DEFAULT 'VERIFIED',
    CONSTRAINT "DebateEvidence_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DebateEvidence" ("finding", "id", "qualityLabel", "qualityScore", "side", "source", "title", "topicId", "url") SELECT "finding", "id", "qualityLabel", "qualityScore", "side", "source", "title", "topicId", "url" FROM "DebateEvidence";
DROP TABLE "DebateEvidence";
ALTER TABLE "new_DebateEvidence" RENAME TO "DebateEvidence";
CREATE INDEX "DebateEvidence_topicId_idx" ON "DebateEvidence"("topicId");
CREATE TABLE "new_DebatePosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "positionScore" INTEGER NOT NULL,
    "positionLabel" TEXT NOT NULL,
    "coreBelief" TEXT NOT NULL,
    "topArgument" TEXT NOT NULL,
    "beliefScore" TEXT NOT NULL DEFAULT '[0]',
    "mediaUrl" TEXT,
    "evidenceId" INTEGER,
    CONSTRAINT "DebatePosition_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DebatePosition_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "DebateEvidence" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DebatePosition" ("beliefScore", "coreBelief", "id", "mediaUrl", "positionLabel", "positionScore", "topArgument", "topicId") SELECT "beliefScore", "coreBelief", "id", "mediaUrl", "positionLabel", "positionScore", "topArgument", "topicId" FROM "DebatePosition";
DROP TABLE "DebatePosition";
ALTER TABLE "new_DebatePosition" RENAME TO "DebatePosition";
CREATE INDEX "DebatePosition_topicId_idx" ON "DebatePosition"("topicId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
