-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN "verificationStatus" TEXT;

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
    "standing" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "engineEvidenceId" INTEGER,
    CONSTRAINT "DebateEvidence_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DebateEvidence_engineEvidenceId_fkey" FOREIGN KEY ("engineEvidenceId") REFERENCES "Evidence" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DebateEvidence" ("argument", "finding", "id", "linkage", "qualityLabel", "qualityScore", "side", "source", "standing", "tier", "title", "topicId", "url") SELECT "argument", "finding", "id", "linkage", "qualityLabel", "qualityScore", "side", "source", "standing", "tier", "title", "topicId", "url" FROM "DebateEvidence";
DROP TABLE "DebateEvidence";
ALTER TABLE "new_DebateEvidence" RENAME TO "DebateEvidence";
CREATE INDEX "DebateEvidence_topicId_idx" ON "DebateEvidence"("topicId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
