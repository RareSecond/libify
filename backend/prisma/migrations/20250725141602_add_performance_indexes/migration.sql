-- CreateIndex
CREATE INDEX "idx_track_played_desc" ON "PlayHistory"("userTrackId", "playedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_played_at" ON "PlayHistory"("playedAt");

-- CreateIndex
CREATE INDEX "idx_tag_track" ON "TrackTag"("tagId", "userTrackId");

-- CreateIndex
CREATE INDEX "idx_user_rating_added" ON "UserTrack"("userId", "rating", "addedAt");

-- CreateIndex
CREATE INDEX "idx_user_plays" ON "UserTrack"("userId", "totalPlayCount", "lastPlayedAt");

-- CreateIndex
CREATE INDEX "idx_user_last_played" ON "UserTrack"("userId", "lastPlayedAt");

-- CreateIndex
CREATE INDEX "idx_track_user" ON "UserTrack"("spotifyTrackId", "userId");
