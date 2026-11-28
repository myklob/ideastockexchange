-- CreateTable
CREATE TABLE "BeliefScoreEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId" INTEGER NOT NULL,
    "scoreBefore" REAL NOT NULL,
    "scoreAfter" REAL NOT NULL,
    "stabilityBefore" REAL,
    "stabilityAfter" REAL,
    "trigger" TEXT NOT NULL DEFAULT 'propagation',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BeliefScoreEvent_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BeliefScoreEvent_beliefId_createdAt_idx" ON "BeliefScoreEvent"("beliefId", "createdAt");
