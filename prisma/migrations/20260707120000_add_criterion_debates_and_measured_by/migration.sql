-- AlterTable: the recursive criteria layer. A criterion's quality score can
-- derive from a dedicated sub-belief ("X is a good measure of Y").
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "criterionBeliefId" INTEGER;
CREATE INDEX "ObjectiveCriteria_criterionBeliefId_idx" ON "ObjectiveCriteria"("criterionBeliefId");

-- AlterTable: evidence measured-by edge. Linked evidence impact is multiplied
-- by the criterion's quality, so weak yardsticks filter their data.
ALTER TABLE "Evidence" ADD COLUMN "criterionId" INTEGER;
