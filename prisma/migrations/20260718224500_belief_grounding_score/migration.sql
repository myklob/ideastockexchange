-- Evidence Grounding Score: engine-computed measure of whether a belief's
-- argument tree bottoms out in tiered evidence. 0 = unfounded (no evidence
-- anywhere in the subtree). Written only by score propagation.
ALTER TABLE "Belief" ADD COLUMN "groundingScore" REAL NOT NULL DEFAULT 0;
