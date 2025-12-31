-- AlterTable
ALTER TABLE "SmartPlaylist" ADD COLUMN     "autoSync" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trackIdsHash" TEXT;
