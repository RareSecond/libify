-- AlterTable
ALTER TABLE "PlayHistory" ALTER COLUMN "playedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastPlaySyncedAt" TIMESTAMP(3);
