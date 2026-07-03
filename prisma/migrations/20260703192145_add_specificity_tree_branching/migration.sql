-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DebateAbstractionRung" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "rungLabel" TEXT NOT NULL,
    "proChain" TEXT NOT NULL,
    "conChain" TEXT NOT NULL,
    "rungType" TEXT NOT NULL DEFAULT 'rung',
    "branchName" TEXT,
    CONSTRAINT "DebateAbstractionRung_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DebateAbstractionRung" ("conChain", "id", "proChain", "rungLabel", "sortOrder", "topicId") SELECT "conChain", "id", "proChain", "rungLabel", "sortOrder", "topicId" FROM "DebateAbstractionRung";
DROP TABLE "DebateAbstractionRung";
ALTER TABLE "new_DebateAbstractionRung" RENAME TO "DebateAbstractionRung";
CREATE INDEX "DebateAbstractionRung_topicId_idx" ON "DebateAbstractionRung"("topicId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
