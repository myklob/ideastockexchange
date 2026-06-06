-- AlterTable
-- Add the "Real Value Conflicts" column to the Common Ground & Compromise section.
ALTER TABLE "DebateCommonGround" ADD COLUMN "valueConflicts" TEXT NOT NULL DEFAULT '[]';
