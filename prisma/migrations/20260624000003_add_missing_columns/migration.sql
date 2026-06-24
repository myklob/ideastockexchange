-- AlterTable: Compromise new template fields
ALTER TABLE "Compromise" ADD COLUMN "sharedPremise" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "synthesis" TEXT;
ALTER TABLE "Compromise" ADD COLUMN "whyDifficult" TEXT;

-- AlterTable: InterestsAnalysis primary pair fields
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponent" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentDrives" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairOpponentValidity" INTEGER;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporter" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterClaim" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterDrives" TEXT;
ALTER TABLE "InterestsAnalysis" ADD COLUMN "primaryPairSupporterValidity" INTEGER;

-- AlterTable: ObjectiveCriteria measurement fields
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "currentStatus" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "howToMeasure" TEXT;
ALTER TABLE "ObjectiveCriteria" ADD COLUMN "target" TEXT;

-- AlterTable: ValuesAnalysis divergence evidence fields
ALTER TABLE "ValuesAnalysis" ADD COLUMN "opposingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "supportingDivergenceEvidence" TEXT;
ALTER TABLE "ValuesAnalysis" ADD COLUMN "whatWouldShift" TEXT;
