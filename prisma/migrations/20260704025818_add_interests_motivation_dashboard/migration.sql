-- AlterTable
ALTER TABLE "InterestEntry" ADD COLUMN "linkageAccuracy" REAL;
ALTER TABLE "InterestEntry" ADD COLUMN "prevalenceScore" REAL;
ALTER TABLE "InterestEntry" ADD COLUMN "validityScore" REAL;

-- AlterTable
ALTER TABLE "SharedInterest" ADD COLUMN "validityScore" REAL;

-- CreateTable
CREATE TABLE "UnstatedInterestCandidate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "behaviorExplained" TEXT NOT NULL,
    "evidence" TEXT,
    "score" REAL,
    "promoted" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnstatedInterestCandidate_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterestSolution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "solution" TEXT NOT NULL,
    "description" TEXT,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterestSolution_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterestSatisfaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "solutionId" INTEGER NOT NULL,
    "interestId" INTEGER NOT NULL,
    "satisfaction" REAL NOT NULL DEFAULT 1,
    CONSTRAINT "InterestSatisfaction_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "InterestSolution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InterestSatisfaction_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "InterestEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UnstatedInterestCandidate_beliefId_idx" ON "UnstatedInterestCandidate"("beliefId");

-- CreateIndex
CREATE INDEX "InterestSolution_beliefId_idx" ON "InterestSolution"("beliefId");

-- CreateIndex
CREATE INDEX "InterestSatisfaction_interestId_idx" ON "InterestSatisfaction"("interestId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestSatisfaction_solutionId_interestId_key" ON "InterestSatisfaction"("solutionId", "interestId");
