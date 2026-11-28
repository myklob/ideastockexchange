-- CreateTable
CREATE TABLE "ConversationThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "beliefId" INTEGER,
    "submittedByAgentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationThread_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ConversationThread_submittedByAgentId_fkey" FOREIGN KEY ("submittedByAgentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "authorHandle" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "postedAt" DATETIME,
    CONSTRAINT "ConversationMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ConversationThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArgumentCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "contextQuote" TEXT,
    "evidenceUrls" TEXT,
    "beliefId" INTEGER,
    "nearestArgumentId" INTEGER,
    "similarity" REAL,
    "band" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "integratedArgumentId" INTEGER,
    "integratedBatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "ArgumentCandidate_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ConversationThread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArgumentCandidate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ConversationMessage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArgumentCandidate_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ArgumentCandidate_nearestArgumentId_fkey" FOREIGN KEY ("nearestArgumentId") REFERENCES "Argument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ArgumentCandidate_integratedArgumentId_fkey" FOREIGN KEY ("integratedArgumentId") REFERENCES "Argument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ConversationThread_beliefId_idx" ON "ConversationThread"("beliefId");

-- CreateIndex
CREATE INDEX "ConversationThread_createdAt_idx" ON "ConversationThread"("createdAt");

-- CreateIndex
CREATE INDEX "ConversationMessage_threadId_idx" ON "ConversationMessage"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMessage_threadId_index_key" ON "ConversationMessage"("threadId", "index");

-- CreateIndex
CREATE INDEX "ArgumentCandidate_threadId_idx" ON "ArgumentCandidate"("threadId");

-- CreateIndex
CREATE INDEX "ArgumentCandidate_beliefId_idx" ON "ArgumentCandidate"("beliefId");

-- CreateIndex
CREATE INDEX "ArgumentCandidate_status_idx" ON "ArgumentCandidate"("status");
