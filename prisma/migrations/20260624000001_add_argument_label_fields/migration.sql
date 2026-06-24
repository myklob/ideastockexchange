-- AlterTable: add short label and quote fields to Argument
ALTER TABLE "Argument" ADD COLUMN "claim" TEXT;
ALTER TABLE "Argument" ADD COLUMN "famousQuote" TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthor" TEXT;
ALTER TABLE "Argument" ADD COLUMN "quoteAuthorUrl" TEXT;
ALTER TABLE "Argument" ADD COLUMN "argumentScore" REAL;
