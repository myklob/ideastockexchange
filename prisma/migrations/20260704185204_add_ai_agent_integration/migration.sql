-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "operator" TEXT,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AgentApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" DATETIME,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "windowStart" DATETIME,
    "windowCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AgentApiKey_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT,
    "batchId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IngestBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IngestBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceDocumentUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngestBatch_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquivalenceCandidate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "existingArgumentId" INTEGER NOT NULL,
    "similarity" REAL NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquivalenceCandidate_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquivalenceCandidate_existingArgumentId_fkey" FOREIGN KEY ("existingArgumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SuggestedEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beliefId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "doi" TEXT,
    "snippet" TEXT,
    "tierClaim" TEXT,
    "divergent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposedByAgentId" TEXT,
    "acceptedEvidenceId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "SuggestedEvidence_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SuggestedEvidence_proposedByAgentId_fkey" FOREIGN KEY ("proposedByAgentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "beliefId" INTEGER,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForumPost_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ForumPost_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ForumComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForumComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ForumComment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Argument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parentBeliefId" INTEGER NOT NULL,
    "beliefId" INTEGER NOT NULL,
    "importanceBeliefId" INTEGER,
    "side" TEXT NOT NULL,
    "linkageScore" REAL NOT NULL DEFAULT 0.1,
    "impactScore" REAL NOT NULL DEFAULT 0,
    "claim" TEXT,
    "famousQuote" TEXT,
    "quoteAuthor" TEXT,
    "quoteAuthorUrl" TEXT,
    "argumentScore" REAL,
    "importanceScore" REAL NOT NULL DEFAULT 1.0,
    "linkageType" TEXT NOT NULL DEFAULT 'ANECDOTAL',
    "linkageScoreType" TEXT NOT NULL DEFAULT 'ACLS',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "scopeNote" TEXT,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "submittedByAgentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Argument_parentBeliefId_fkey" FOREIGN KEY ("parentBeliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Argument_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Argument_importanceBeliefId_fkey" FOREIGN KEY ("importanceBeliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Argument_submittedByAgentId_fkey" FOREIGN KEY ("submittedByAgentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Argument" ("argumentScore", "beliefId", "claim", "createdAt", "depth", "famousQuote", "id", "impactScore", "importanceBeliefId", "importanceScore", "linkageScore", "linkageScoreType", "linkageType", "parentBeliefId", "quoteAuthor", "quoteAuthorUrl", "scopeNote", "side", "updatedAt") SELECT "argumentScore", "beliefId", "claim", "createdAt", "depth", "famousQuote", "id", "impactScore", "importanceBeliefId", "importanceScore", "linkageScore", "linkageScoreType", "linkageType", "parentBeliefId", "quoteAuthor", "quoteAuthorUrl", "scopeNote", "side", "updatedAt" FROM "Argument";
DROP TABLE "Argument";
ALTER TABLE "new_Argument" RENAME TO "Argument";
CREATE INDEX "Argument_importanceBeliefId_idx" ON "Argument"("importanceBeliefId");
CREATE INDEX "Argument_submittedByAgentId_idx" ON "Argument"("submittedByAgentId");
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
    "specificity" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "falsifiability" TEXT,
    "falsifiabilityConfirm" TEXT,
    "falsifiabilityFalsify" TEXT,
    "netInterpretation" TEXT,
    "bottomLine" TEXT,
    "scoreMover" TEXT,
    "logicalForm" TEXT,
    "relatedBeliefs" TEXT,
    "supportsBeliefs" TEXT,
    "reviewFlag" BOOLEAN NOT NULL DEFAULT false,
    "reviewFlagNote" TEXT
);
INSERT INTO "new_Belief" ("bottomLine", "category", "claimStrength", "createdAt", "deweyNumber", "falsifiability", "falsifiabilityConfirm", "falsifiabilityFalsify", "id", "logicalForm", "netInterpretation", "positivity", "relatedBeliefs", "scoreMover", "slug", "specificity", "stabilityScore", "statement", "subcategory", "supportsBeliefs", "updatedAt") SELECT "bottomLine", "category", "claimStrength", "createdAt", "deweyNumber", "falsifiability", "falsifiabilityConfirm", "falsifiabilityFalsify", "id", "logicalForm", "netInterpretation", "positivity", "relatedBeliefs", "scoreMover", "slug", "specificity", "stabilityScore", "statement", "subcategory", "supportsBeliefs", "updatedAt" FROM "Belief";
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
    CONSTRAINT "Evidence_retrievedByAgentId_fkey" FOREIGN KEY ("retrievedByAgentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Evidence" ("beliefId", "conclusionRelevance", "createdAt", "description", "evidenceType", "evsScore", "id", "impactScore", "linkageScore", "linkageScoreType", "replicationPercentage", "replicationQuantity", "side", "sourceIndependenceWeight", "sourceUrl", "updatedAt") SELECT "beliefId", "conclusionRelevance", "createdAt", "description", "evidenceType", "evsScore", "id", "impactScore", "linkageScore", "linkageScoreType", "replicationPercentage", "replicationQuantity", "side", "sourceIndependenceWeight", "sourceUrl", "updatedAt" FROM "Evidence";
DROP TABLE "Evidence";
ALTER TABLE "new_Evidence" RENAME TO "Evidence";
CREATE INDEX "Evidence_retrievedByAgentId_idx" ON "Evidence"("retrievedByAgentId");
CREATE TABLE "new_LinkageArgument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "argumentId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "strength" REAL NOT NULL DEFAULT 0.5,
    "pattern" TEXT,
    "score" REAL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "targetFactor" TEXT,
    "fallacyType" TEXT,
    "rationale" TEXT,
    "submittedByAgentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkageArgument_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "Argument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LinkageArgument_submittedByAgentId_fkey" FOREIGN KEY ("submittedByAgentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LinkageArgument" ("argumentId", "createdAt", "id", "pattern", "score", "side", "sortOrder", "statement", "strength") SELECT "argumentId", "createdAt", "id", "pattern", "score", "side", "sortOrder", "statement", "strength" FROM "LinkageArgument";
DROP TABLE "LinkageArgument";
ALTER TABLE "new_LinkageArgument" RENAME TO "LinkageArgument";
CREATE INDEX "LinkageArgument_argumentId_idx" ON "LinkageArgument"("argumentId");
CREATE INDEX "LinkageArgument_status_idx" ON "LinkageArgument"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_key" ON "Agent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AgentApiKey_hashedKey_key" ON "AgentApiKey"("hashedKey");

-- CreateIndex
CREATE INDEX "AgentApiKey_agentId_idx" ON "AgentApiKey"("agentId");

-- CreateIndex
CREATE INDEX "AuditLog_agentId_idx" ON "AuditLog"("agentId");

-- CreateIndex
CREATE INDEX "AuditLog_batchId_idx" ON "AuditLog"("batchId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "IngestBatch_agentId_idx" ON "IngestBatch"("agentId");

-- CreateIndex
CREATE INDEX "IngestBatch_createdAt_idx" ON "IngestBatch"("createdAt");

-- CreateIndex
CREATE INDEX "EquivalenceCandidate_argumentId_idx" ON "EquivalenceCandidate"("argumentId");

-- CreateIndex
CREATE INDEX "EquivalenceCandidate_existingArgumentId_idx" ON "EquivalenceCandidate"("existingArgumentId");

-- CreateIndex
CREATE INDEX "SuggestedEvidence_beliefId_idx" ON "SuggestedEvidence"("beliefId");

-- CreateIndex
CREATE INDEX "SuggestedEvidence_status_idx" ON "SuggestedEvidence"("status");

-- CreateIndex
CREATE INDEX "ForumPost_beliefId_idx" ON "ForumPost"("beliefId");

-- CreateIndex
CREATE INDEX "ForumPost_createdAt_idx" ON "ForumPost"("createdAt");

-- CreateIndex
CREATE INDEX "ForumComment_postId_idx" ON "ForumComment"("postId");
