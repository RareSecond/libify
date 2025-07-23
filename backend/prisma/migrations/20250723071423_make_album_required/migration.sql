/*
  Warnings:

  - Made the column `albumId` on table `SpotifyTrack` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SpotifyTrack" DROP CONSTRAINT "SpotifyTrack_albumId_fkey";

-- AlterTable
ALTER TABLE "SpotifyTrack" ALTER COLUMN "albumId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "SpotifyTrack" ADD CONSTRAINT "SpotifyTrack_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "SpotifyAlbum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
