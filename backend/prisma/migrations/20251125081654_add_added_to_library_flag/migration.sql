-- AlterTable
ALTER TABLE "UserTrack" ADD COLUMN     "addedToLibrary" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "UserTrack_userId_addedToLibrary_idx" ON "UserTrack"("userId", "addedToLibrary");
