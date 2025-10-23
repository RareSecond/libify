/*
  Warnings:

  - A unique constraint covering the columns `[userTrackId,playedAt]` on the table `PlayHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlayHistory_userTrackId_playedAt_key" ON "PlayHistory"("userTrackId", "playedAt");
