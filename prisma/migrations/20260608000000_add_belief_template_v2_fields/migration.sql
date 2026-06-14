-- Add columns and tables introduced by the April 2026 belief-page template.

-- Argument display fields: short label, inline quote, and displayed score.
ALTER TABLE "Argument" ADD COLUMN "claim"          TEXT;
ALTER TABLE "Argument" ADD COLUMN "famousQuote"    TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthor"    TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthorUrl" TEXT;
ALTER TABLE "Argument" ADD COLUMN "argumentScore"  REAL;

-- Falsifiability Test: two-sided free text (Evidence That Would Confirm / Falsify).
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityConfirm" TEXT;
ALTER TABLE "Belief" ADD COLUMN "falsifiabilityFalsify" TEXT;

-- One-line interpretation of the Net Belief Score shown beneath the argument trees.
ALTER TABLE "Belief" ADD COLUMN "netInterpretation" TEXT;

-- Header metadata: pipe- or newline-separated lists of related/parent beliefs.
ALTER TABLE "Belief" ADD COLUMN "relatedBeliefs" TEXT;
ALTER TABLE "Belief" ADD COLUMN "supportsBeliefs" TEXT;

-- ValueRanking: Shared Values, Different Rankings (section 3a).
CREATE TABLE "ValueRanking" (
    "id"           INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId"     INTEGER  NOT NULL,
    "value"        TEXT     NOT NULL,
    "supporterRank" INTEGER,
    "opponentRank"  INTEGER,
    "whyDiffer"    TEXT,
    "sortOrder"    INTEGER  NOT NULL DEFAULT 0,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValueRanking_beliefId_fkey"
        FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ValueRanking_beliefId_idx" ON "ValueRanking"("beliefId");

-- InterestEntry: Likely Interests of Supporters / Opponents (sections 3b / 3c).
CREATE TABLE "InterestEntry" (
    "id"                INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId"          INTEGER  NOT NULL,
    "side"              TEXT     NOT NULL,
    "interest"          TEXT     NOT NULL,
    "prevalence"        TEXT,
    "linkageConfidence" TEXT,
    "validity"          TEXT,
    "evidenceBasis"     TEXT,
    "connectedValue"    TEXT,
    "pretextual"        BOOLEAN  NOT NULL DEFAULT 0,
    "sortOrder"         INTEGER  NOT NULL DEFAULT 0,
    "createdAt"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterestEntry_beliefId_fkey"
        FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "InterestEntry_beliefId_idx" ON "InterestEntry"("beliefId");

-- SharedInterest: Shared and Conflicting Interests (section 3d).
CREATE TABLE "SharedInterest" (
    "id"                  INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId"            INTEGER  NOT NULL,
    "interest"            TEXT     NOT NULL,
    "validity"            TEXT,
    "compromiseDirection" TEXT,
    "sortOrder"           INTEGER  NOT NULL DEFAULT 0,
    "createdAt"           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharedInterest_beliefId_fkey"
        FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "SharedInterest_beliefId_idx" ON "SharedInterest"("beliefId");

-- DisputeType: Dispute Types (section 3f — Empirical / Definitional / Values).
CREATE TABLE "DisputeType" (
    "id"               INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beliefId"         INTEGER  NOT NULL,
    "disputeType"      TEXT     NOT NULL,
    "disagreement"     TEXT,
    "evidenceThatMoves" TEXT,
    "sortOrder"        INTEGER  NOT NULL DEFAULT 0,
    "createdAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisputeType_beliefId_fkey"
        FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "DisputeType_beliefId_idx" ON "DisputeType"("beliefId");
