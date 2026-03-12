-- CreateTable
CREATE TABLE "DebateTopic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryPath" TEXT NOT NULL DEFAULT '[]',
    "wikipediaUrl" TEXT,
    "deweyDecimal" TEXT,
    "locSubjectHeading" TEXT,
    "locUrl" TEXT,
    "stanfordUrl" TEXT,
    "definition" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "assumptionKeyInsight" TEXT,
    "importanceScore" INTEGER NOT NULL DEFAULT 0,
    "evidenceDepth" TEXT NOT NULL DEFAULT 'Med',
    "controversyRating" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DebateClaimMagnitude" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "magnitudeLevel" TEXT NOT NULL,
    "magnitudePercent" INTEGER NOT NULL DEFAULT 50,
    "sublabel" TEXT NOT NULL,
    "proExample" TEXT NOT NULL,
    "antiExample" TEXT NOT NULL,
    "scopeDescription" TEXT NOT NULL,
    CONSTRAINT "DebateClaimMagnitude_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebatePosition" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "positionScore" INTEGER NOT NULL,
    "positionLabel" TEXT NOT NULL,
    "coreBelief" TEXT NOT NULL,
    "topArgument" TEXT NOT NULL,
    "beliefScore" TEXT NOT NULL DEFAULT '[0]',
    "mediaUrl" TEXT,
    CONSTRAINT "DebatePosition_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateEscalation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "levelLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "principles" TEXT NOT NULL,
    "proDescription" TEXT NOT NULL DEFAULT '',
    "antiDescription" TEXT NOT NULL DEFAULT '',
    "proExample" TEXT NOT NULL DEFAULT '',
    "antiExample" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "DebateEscalation_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateAssumption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "positionRange" TEXT NOT NULL,
    "positionLabel" TEXT NOT NULL,
    "assumptions" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "DebateAssumption_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateAbstractionRung" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "rungLabel" TEXT NOT NULL,
    "proChain" TEXT NOT NULL,
    "conChain" TEXT NOT NULL,
    CONSTRAINT "DebateAbstractionRung_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateCoreValues" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "supportingAdvertised" TEXT NOT NULL DEFAULT '[]',
    "supportingActual" TEXT NOT NULL DEFAULT '[]',
    "opposingAdvertised" TEXT NOT NULL DEFAULT '[]',
    "opposingActual" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "DebateCoreValues_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateCommonGround" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "agreements" TEXT NOT NULL DEFAULT '[]',
    "compromises" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "DebateCommonGround_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateEvidence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "qualityScore" INTEGER NOT NULL DEFAULT 75,
    "qualityLabel" TEXT NOT NULL DEFAULT 'Peer Reviewed',
    "url" TEXT,
    CONSTRAINT "DebateEvidence_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateObjectiveCriteria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteriaScore" INTEGER NOT NULL DEFAULT 50,
    "validity" TEXT NOT NULL DEFAULT 'Med',
    "reliability" TEXT NOT NULL DEFAULT 'Med',
    "linkage" TEXT NOT NULL DEFAULT 'Med',
    "importance" TEXT NOT NULL DEFAULT 'Med',
    "url" TEXT,
    CONSTRAINT "DebateObjectiveCriteria_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateMediaResource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "biasOrTone" TEXT NOT NULL,
    "positivity" INTEGER NOT NULL DEFAULT 0,
    "magnitude" INTEGER NOT NULL DEFAULT 50,
    "escalation" INTEGER NOT NULL DEFAULT 2,
    "keyInsight" TEXT NOT NULL,
    "url" TEXT,
    CONSTRAINT "DebateMediaResource_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DebateRelatedTopic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topicId" INTEGER NOT NULL,
    "relationType" TEXT NOT NULL,
    "relatedTitle" TEXT NOT NULL,
    "relatedSlug" TEXT,
    "relatedUrl" TEXT,
    CONSTRAINT "DebateRelatedTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "DebateTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DebateTopic_slug_key" ON "DebateTopic"("slug");

-- CreateIndex
CREATE INDEX "DebateTopic_slug_idx" ON "DebateTopic"("slug");

-- CreateIndex
CREATE INDEX "DebateClaimMagnitude_topicId_idx" ON "DebateClaimMagnitude"("topicId");

-- CreateIndex
CREATE INDEX "DebatePosition_topicId_idx" ON "DebatePosition"("topicId");

-- CreateIndex
CREATE INDEX "DebateEscalation_topicId_idx" ON "DebateEscalation"("topicId");

-- CreateIndex
CREATE INDEX "DebateAssumption_topicId_idx" ON "DebateAssumption"("topicId");

-- CreateIndex
CREATE INDEX "DebateAbstractionRung_topicId_idx" ON "DebateAbstractionRung"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateCoreValues_topicId_key" ON "DebateCoreValues"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "DebateCommonGround_topicId_key" ON "DebateCommonGround"("topicId");

-- CreateIndex
CREATE INDEX "DebateEvidence_topicId_idx" ON "DebateEvidence"("topicId");

-- CreateIndex
CREATE INDEX "DebateObjectiveCriteria_topicId_idx" ON "DebateObjectiveCriteria"("topicId");

-- CreateIndex
CREATE INDEX "DebateMediaResource_topicId_idx" ON "DebateMediaResource"("topicId");

-- CreateIndex
CREATE INDEX "DebateRelatedTopic_topicId_idx" ON "DebateRelatedTopic"("topicId");
