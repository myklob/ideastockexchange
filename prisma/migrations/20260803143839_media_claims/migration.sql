-- CreateTable
CREATE TABLE "MediaClaim" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mediaResourceId" INTEGER NOT NULL,
    "claimText" TEXT NOT NULL,
    "beliefId" INTEGER,
    "linkageScore" REAL NOT NULL DEFAULT 0.5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaClaim_mediaResourceId_fkey" FOREIGN KEY ("mediaResourceId") REFERENCES "MediaResource" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaClaim_beliefId_fkey" FOREIGN KEY ("beliefId") REFERENCES "Belief" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MediaClaim_mediaResourceId_idx" ON "MediaClaim"("mediaResourceId");

-- CreateIndex
CREATE INDEX "MediaClaim_beliefId_idx" ON "MediaClaim"("beliefId");
