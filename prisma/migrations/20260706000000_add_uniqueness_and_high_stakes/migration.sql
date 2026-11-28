-- AlterTable: the uniqueness discount, applied at scoring time (Rule 6: null until computed).
ALTER TABLE "Argument" ADD COLUMN "uniquenessScore" REAL;

-- AlterTable: high-stakes beliefs route posting through the speed-bump flow.
ALTER TABLE "Belief" ADD COLUMN "highStakes" BOOLEAN NOT NULL DEFAULT false;
