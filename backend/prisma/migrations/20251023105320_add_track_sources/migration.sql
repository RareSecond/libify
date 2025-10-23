-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('LIKED_SONGS', 'PLAYLIST', 'ALBUM', 'ARTIST_TOP_TRACKS');

-- CreateTable
CREATE TABLE "TrackSource" (
    "id" TEXT NOT NULL,
    "userTrackId" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceName" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackSource_userTrackId_idx" ON "TrackSource"("userTrackId");

-- CreateIndex
CREATE INDEX "TrackSource_sourceType_idx" ON "TrackSource"("sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "TrackSource_userTrackId_sourceType_sourceId_key" ON "TrackSource"("userTrackId", "sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "TrackSource" ADD CONSTRAINT "TrackSource_userTrackId_fkey" FOREIGN KEY ("userTrackId") REFERENCES "UserTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
