-- Migration: add_all_scores
-- Integrates all ReasonRank scoring dimensions into the database schema.
--
-- Scores added:
--   Argument.importanceScore    — Importance Score (0-1): how much this argument moves the needle
--   Evidence.evsScore           — Evidence Verification Score: EVS = ESIW × log2(ERQ+1) × ECRS × ERP
--   MediaResource.truthScore    — Media Truth Score (0-1): flags editorializing/sensationalism
--   MediaResource.genreScore    — Media Genre Score (0-1): reliability weight by genre classification
--   MediaResource.genreType     — Genre label (peer_reviewed, institutional, investigative, etc.)
--   MediaResource.reliabilityTier — T1–T4 tier matching Evidence tier system
--   Belief.stabilityScore       — Confidence Stability Score (0-1): how settled the score is over time
--   SimilarBelief.equivalencyScore — Belief Equivalency Score (0-1): same underlying claim, different wording

-- Importance Score on Arguments
ALTER TABLE "Argument" ADD COLUMN "importanceScore" REAL NOT NULL DEFAULT 1.0;

-- Evidence Verification Score on Evidence
ALTER TABLE "Evidence" ADD COLUMN "evsScore" REAL NOT NULL DEFAULT 0.0;

-- Media Truth Score, Genre Score, Genre Type, Reliability Tier on MediaResource
ALTER TABLE "MediaResource" ADD COLUMN "truthScore" REAL NOT NULL DEFAULT 0.5;
ALTER TABLE "MediaResource" ADD COLUMN "genreScore" REAL NOT NULL DEFAULT 0.5;
ALTER TABLE "MediaResource" ADD COLUMN "genreType" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "MediaResource" ADD COLUMN "reliabilityTier" TEXT NOT NULL DEFAULT 'T3';

-- Confidence Stability Score on Belief
ALTER TABLE "Belief" ADD COLUMN "stabilityScore" REAL NOT NULL DEFAULT 0.5;

-- Belief Equivalency Score on SimilarBelief
ALTER TABLE "SimilarBelief" ADD COLUMN "equivalencyScore" REAL NOT NULL DEFAULT 0.0;
