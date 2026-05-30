-- AlterTable: source an argument's Importance Score from a dedicated sub-belief.
ALTER TABLE "Argument" ADD COLUMN "importanceBeliefId" INTEGER;

-- CreateIndex
CREATE INDEX "Argument_importanceBeliefId_idx" ON "Argument"("importanceBeliefId");
