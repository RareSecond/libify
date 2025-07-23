/*
  Warnings:

  - You are about to drop the column `album` on the `SpotifyTrack` table. All the data in the column will be lost.
  - You are about to drop the column `albumArt` on the `SpotifyTrack` table. All the data in the column will be lost.
  - You are about to drop the column `artist` on the `SpotifyTrack` table. All the data in the column will be lost.
  - Added the required column `artistId` to the `SpotifyTrack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotifyTrack" DROP COLUMN "album",
DROP COLUMN "albumArt",
DROP COLUMN "artist",
ADD COLUMN     "albumId" TEXT,
ADD COLUMN     "artistId" TEXT NOT NULL,
ADD COLUMN     "discNumber" INTEGER,
ADD COLUMN     "explicit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "popularity" INTEGER,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "trackNumber" INTEGER;

-- CreateTable
CREATE TABLE "SpotifyArtist" (
    "id" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "genres" TEXT[],
    "popularity" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotifyArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotifyAlbum" (
    "id" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "releaseDate" TIMESTAMP(3),
    "totalTracks" INTEGER,
    "albumType" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotifyAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserArtist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "albumCount" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "totalPlayCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "ratedTrackCount" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "firstAddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAlbum" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "totalPlayCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "ratedTrackCount" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "firstAddedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyArtist_spotifyId_key" ON "SpotifyArtist"("spotifyId");

-- CreateIndex
CREATE INDEX "SpotifyArtist_name_idx" ON "SpotifyArtist"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyAlbum_spotifyId_key" ON "SpotifyAlbum"("spotifyId");

-- CreateIndex
CREATE INDEX "SpotifyAlbum_name_idx" ON "SpotifyAlbum"("name");

-- CreateIndex
CREATE INDEX "SpotifyAlbum_artistId_idx" ON "SpotifyAlbum"("artistId");

-- CreateIndex
CREATE INDEX "UserArtist_userId_avgRating_idx" ON "UserArtist"("userId", "avgRating");

-- CreateIndex
CREATE INDEX "UserArtist_userId_lastPlayedAt_idx" ON "UserArtist"("userId", "lastPlayedAt");

-- CreateIndex
CREATE INDEX "UserArtist_userId_trackCount_idx" ON "UserArtist"("userId", "trackCount");

-- CreateIndex
CREATE INDEX "UserArtist_userId_totalPlayCount_idx" ON "UserArtist"("userId", "totalPlayCount");

-- CreateIndex
CREATE UNIQUE INDEX "UserArtist_userId_artistId_key" ON "UserArtist"("userId", "artistId");

-- CreateIndex
CREATE INDEX "UserAlbum_userId_avgRating_idx" ON "UserAlbum"("userId", "avgRating");

-- CreateIndex
CREATE INDEX "UserAlbum_userId_lastPlayedAt_idx" ON "UserAlbum"("userId", "lastPlayedAt");

-- CreateIndex
CREATE INDEX "UserAlbum_userId_trackCount_idx" ON "UserAlbum"("userId", "trackCount");

-- CreateIndex
CREATE INDEX "UserAlbum_userId_totalPlayCount_idx" ON "UserAlbum"("userId", "totalPlayCount");

-- CreateIndex
CREATE UNIQUE INDEX "UserAlbum_userId_albumId_key" ON "UserAlbum"("userId", "albumId");

-- CreateIndex
CREATE INDEX "SpotifyTrack_artistId_idx" ON "SpotifyTrack"("artistId");

-- CreateIndex
CREATE INDEX "SpotifyTrack_albumId_idx" ON "SpotifyTrack"("albumId");

-- CreateIndex
CREATE INDEX "SpotifyTrack_title_idx" ON "SpotifyTrack"("title");

-- AddForeignKey
ALTER TABLE "SpotifyAlbum" ADD CONSTRAINT "SpotifyAlbum_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "SpotifyArtist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "SpotifyArtist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "SpotifyAlbum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserArtist" ADD CONSTRAINT "UserArtist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserArtist" ADD CONSTRAINT "UserArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "SpotifyArtist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAlbum" ADD CONSTRAINT "UserAlbum_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAlbum" ADD CONSTRAINT "UserAlbum_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "SpotifyAlbum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
