-- CreateTable
CREATE TABLE "FallacyClaim" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "fallacyType" TEXT NOT NULL,
    "targetFactor" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "quotedText" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "missingElements" TEXT NOT NULL,
    "evidenceLinks" TEXT NOT NULL,
    "consequences" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "consensus" REAL,
    "resolvedAt" DATETIME,
    "counterLinkageArgumentId" INTEGER,
    "submittedById" TEXT,
    "submittedByAgentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FallacyClaim_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FallacyClaim_submittedByAgentId_fkey" FOREIGN KEY ("submittedByAgentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FallacyClaimVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fallacyClaimId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "agree" BOOLEAN NOT NULL,
    "reasoning" TEXT,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FallacyClaimVote_fallacyClaimId_fkey" FOREIGN KEY ("fallacyClaimId") REFERENCES "FallacyClaim" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupingVote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "candidateId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "agree" BOOLEAN NOT NULL,
    "reasoning" TEXT,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupingVote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "EquivalenceCandidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EquivalenceCandidate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "existingArgumentId" INTEGER NOT NULL,
    "similarity" REAL NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    "consensus" REAL,
    "resolvedAt" DATETIME,
    CONSTRAINT "EquivalenceCandidate_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquivalenceCandidate_existingArgumentId_fkey" FOREIGN KEY ("existingArgumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EquivalenceCandidate" ("argumentId", "detectedAt", "existingArgumentId", "id", "similarity") SELECT "argumentId", "detectedAt", "existingArgumentId", "id", "similarity" FROM "EquivalenceCandidate";
DROP TABLE "EquivalenceCandidate";
ALTER TABLE "new_EquivalenceCandidate" RENAME TO "EquivalenceCandidate";
CREATE INDEX "EquivalenceCandidate_argumentId_idx" ON "EquivalenceCandidate"("argumentId");
CREATE INDEX "EquivalenceCandidate_existingArgumentId_idx" ON "EquivalenceCandidate"("existingArgumentId");
CREATE INDEX "EquivalenceCandidate_status_idx" ON "EquivalenceCandidate"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FallacyClaim_counterLinkageArgumentId_key" ON "FallacyClaim"("counterLinkageArgumentId");

-- CreateIndex
CREATE INDEX "FallacyClaim_argumentId_idx" ON "FallacyClaim"("argumentId");

-- CreateIndex
CREATE INDEX "FallacyClaim_status_idx" ON "FallacyClaim"("status");

-- CreateIndex
CREATE INDEX "FallacyClaim_submittedById_idx" ON "FallacyClaim"("submittedById");

-- CreateIndex
CREATE INDEX "FallacyClaim_submittedByAgentId_idx" ON "FallacyClaim"("submittedByAgentId");

-- CreateIndex
CREATE INDEX "FallacyClaimVote_fallacyClaimId_idx" ON "FallacyClaimVote"("fallacyClaimId");

-- CreateIndex
CREATE INDEX "FallacyClaimVote_userId_idx" ON "FallacyClaimVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FallacyClaimVote_fallacyClaimId_userId_key" ON "FallacyClaimVote"("fallacyClaimId", "userId");

-- CreateIndex
CREATE INDEX "GroupingVote_candidateId_idx" ON "GroupingVote"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupingVote_candidateId_userId_key" ON "GroupingVote"("candidateId", "userId");
