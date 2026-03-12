-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ObjectiveCriteria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "validityScore" REAL NOT NULL DEFAULT 0.5,
    "reliabilityScore" REAL NOT NULL DEFAULT 0.5,
    "independenceScore" REAL NOT NULL DEFAULT 0.5,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "criteriaType" TEXT,
    "totalScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObjectiveCriteria_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ObjectiveCriteria" ("beliefId", "createdAt", "criteriaType", "description", "id", "independenceScore", "linkageScore", "totalScore") SELECT "beliefId", "createdAt", "criteriaType", "description", "id", "independenceScore", "linkageScore", "totalScore" FROM "ObjectiveCriteria";
DROP TABLE "ObjectiveCriteria";
ALTER TABLE "new_ObjectiveCriteria" RENAME TO "ObjectiveCriteria";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
