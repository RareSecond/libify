-- AlterTable
ALTER TABLE "SpotifyTrack" ADD COLUMN     "acousticness" DOUBLE PRECISION,
ADD COLUMN     "audioFeaturesUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "danceability" DOUBLE PRECISION,
ADD COLUMN     "energy" DOUBLE PRECISION,
ADD COLUMN     "instrumentalness" DOUBLE PRECISION,
ADD COLUMN     "key" INTEGER,
ADD COLUMN     "liveness" DOUBLE PRECISION,
ADD COLUMN     "loudness" DOUBLE PRECISION,
ADD COLUMN     "mode" INTEGER,
ADD COLUMN     "speechiness" DOUBLE PRECISION,
ADD COLUMN     "tempo" DOUBLE PRECISION,
ADD COLUMN     "timeSignature" INTEGER,
ADD COLUMN     "valence" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "SpotifyTrack_tempo_idx" ON "SpotifyTrack"("tempo");

-- CreateIndex
CREATE INDEX "SpotifyTrack_energy_idx" ON "SpotifyTrack"("energy");

-- CreateIndex
CREATE INDEX "SpotifyTrack_danceability_idx" ON "SpotifyTrack"("danceability");

-- CreateIndex
CREATE INDEX "SpotifyTrack_valence_idx" ON "SpotifyTrack"("valence");
