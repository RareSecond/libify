-- AlterTable
ALTER TABLE "SmartPlaylist" ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "spotifyPlaylistId" TEXT;
