/*
  Warnings:

  - A unique constraint covering the columns `[isrc]` on the table `SpotifyTrack` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "isrc" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyTrack_isrc_key" ON "SpotifyTrack"("isrc");

-- CreateIndex
CREATE INDEX "SpotifyTrack_isrc_idx" ON "SpotifyTrack"("isrc");
