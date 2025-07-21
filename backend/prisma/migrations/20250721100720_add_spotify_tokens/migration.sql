-- AlterTable
ALTER TABLE "User" ADD COLUMN     "spotifyAccessToken" TEXT,
ADD COLUMN     "spotifyRefreshToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);
