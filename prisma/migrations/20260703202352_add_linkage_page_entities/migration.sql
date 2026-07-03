-- AlterTable
ALTER TABLE "Argument" ADD COLUMN "scopeNote" TEXT;

-- CreateTable
CREATE TABLE "LinkageRephrasing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "target" TEXT NOT NULL,
    "label" TEXT,
    "text" TEXT NOT NULL,
    "equivalencyScore" REAL,
    "linkageScore" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkageRephrasing_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkageFiveStepCheck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "parentWording" TEXT,
    "sourceWording" TEXT,
    "mechanismSentence" TEXT,
    "provisionalEstimate" REAL,
    "dominantFactor" TEXT,
    "flagNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LinkageFiveStepCheck_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkageAssumption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkageAssumption_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkageBiasRisk" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkageBiasRisk_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LinkageFailureExample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "failureMode" TEXT NOT NULL,
    "xText" TEXT,
    "yText" TEXT,
    "whyFails" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkageFailureExample_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LinkageArgument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "pattern" TEXT,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkageArgument_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LinkageArgument" ("argumentId", "createdAt", "id", "side", "statement", "strength") SELECT "argumentId", "createdAt", "id", "side", "statement", "strength" FROM "LinkageArgument";
DROP TABLE "LinkageArgument";
ALTER TABLE "new_LinkageArgument" RENAME TO "LinkageArgument";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LinkageRephrasing_argumentId_idx" ON "LinkageRephrasing"("argumentId");

-- CreateIndex
CREATE UNIQUE INDEX "LinkageFiveStepCheck_argumentId_key" ON "LinkageFiveStepCheck"("argumentId");

-- CreateIndex
CREATE INDEX "LinkageAssumption_argumentId_idx" ON "LinkageAssumption"("argumentId");

-- CreateIndex
CREATE INDEX "LinkageBiasRisk_argumentId_idx" ON "LinkageBiasRisk"("argumentId");

-- CreateIndex
CREATE INDEX "LinkageFailureExample_argumentId_idx" ON "LinkageFailureExample"("argumentId");
