-- CreateTable
CREATE TABLE "InjuryReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamName" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "injury" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "returnDate" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "InjuryReport_teamName_idx" ON "InjuryReport"("teamName");

-- CreateIndex
CREATE INDEX "InjuryReport_sport_idx" ON "InjuryReport"("sport");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "InjuryReport_teamName_playerName_key" ON "InjuryReport"("teamName", "playerName");
