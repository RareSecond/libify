-- CreateTable
CREATE TABLE "UserPlaylist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "snapshotId" TEXT NOT NULL,
    "totalTracks" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT,
    "collaborative" BOOLEAN NOT NULL DEFAULT false,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPlaylist_userId_idx" ON "UserPlaylist"("userId");

-- CreateIndex
CREATE INDEX "UserPlaylist_snapshotId_idx" ON "UserPlaylist"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlaylist_userId_spotifyId_key" ON "UserPlaylist"("userId", "spotifyId");

-- AddForeignKey
ALTER TABLE "UserPlaylist" ADD CONSTRAINT "UserPlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
