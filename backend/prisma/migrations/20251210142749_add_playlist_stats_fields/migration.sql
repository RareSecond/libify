-- AlterTable
ALTER TABLE "UserPlaylist" ADD COLUMN     "avgRating" DOUBLE PRECISION,
ADD COLUMN     "firstAddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastPlayedAt" TIMESTAMP(3),
ADD COLUMN     "ratedTrackCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDuration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPlayCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "UserPlaylist_userId_avgRating_idx" ON "UserPlaylist"("userId", "avgRating");

-- CreateIndex
CREATE INDEX "UserPlaylist_userId_lastPlayedAt_idx" ON "UserPlaylist"("userId", "lastPlayedAt");

-- CreateIndex
CREATE INDEX "UserPlaylist_userId_totalPlayCount_idx" ON "UserPlaylist"("userId", "totalPlayCount");

-- CreateIndex
CREATE INDEX "UserPlaylist_userId_totalTracks_idx" ON "UserPlaylist"("userId", "totalTracks");
