import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { AuthService } from "../../auth/auth.service";
import { DatabaseService } from "../../database/database.service";
import { AggregationService } from "../../library/aggregation.service";
import { PlaySyncService } from "../../library/play-sync.service";
import { SpotifyService } from "../../library/spotify.service";

export interface PlaySyncJobData {
  userId?: string;
}

@Processor("play-sync")
export class PlaySyncProcessor extends WorkerHost {
  private readonly logger = new Logger(PlaySyncProcessor.name);

  constructor(
    private databaseService: DatabaseService,
    private spotifyService: SpotifyService,
    private authService: AuthService,
    private aggregationService: AggregationService,
    private playSyncService: PlaySyncService,
  ) {
    super();
  }

  async process(
    job: Job<PlaySyncJobData>,
  ): Promise<{ enqueuedCount?: number; newPlaysCount?: number }> {
    // Handle scheduler job that enqueues all user syncs
    if (job.name === "sync-all-users") {
      this.logger.log(`Starting scheduler job to enqueue all user syncs`);
      try {
        const enqueuedCount = await this.playSyncService.enqueueAllUserSyncs();
        this.logger.log(
          `Scheduler job completed: ${enqueuedCount} jobs enqueued`,
        );
        return { enqueuedCount };
      } catch (error) {
        this.logger.error(
          `Scheduler job failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }

    // Handle individual user sync job
    const { userId } = job.data;
    if (!userId) {
      throw new Error("userId is required for sync-user-plays job");
    }

    this.logger.log(
      `🔄 PLAY SYNC PROCESSOR STARTED for user ${userId} (Job: ${job.id})`,
    );

    try {
      // Get valid access token (auto-refreshes if expired)
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Failed to get Spotify access token");
      }

      // Get user's last sync timestamp
      const user = await this.databaseService.user.findUnique({
        select: { lastPlaySyncedAt: true },
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      this.logger.log(
        `Last play synced at: ${user.lastPlaySyncedAt ? user.lastPlaySyncedAt.toISOString() : "never"}`,
      );

      // Fetch recently played tracks from Spotify (latest 50, no time filter)
      // Note: Not using afterTimestamp to always get the full 50 tracks for debugging
      const recentlyPlayed = await this.spotifyService.getRecentlyPlayed(
        accessToken,
        50,
      );

      this.logger.log(
        `Spotify returned ${recentlyPlayed?.length || 0} recently played tracks`,
      );

      // Log summary of tracks
      if (recentlyPlayed && recentlyPlayed.length > 0) {
        this.logger.log("Track summary:");
        recentlyPlayed.forEach((item) => {
          const timestamp = new Date(item.played_at).toLocaleString("en-US", {
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            month: "short",
          });
          const artist = item.track.artists?.[0]?.name || "Unknown Artist";
          const track = item.track.name || "Unknown Track";
          this.logger.log(`  ${timestamp} - ${artist} - ${track}`);
        });
      }

      // ALWAYS write Spotify API response to file for debugging (even if 0 results)
      const fs = await import("fs/promises");
      const path = await import("path");
      const debugFile = path.join(
        process.cwd(),
        `spotify-plays-debug-${Date.now()}.json`,
      );
      await fs.writeFile(
        debugFile,
        JSON.stringify(
          {
            count: recentlyPlayed?.length || 0,
            items: recentlyPlayed || [],
            lastPlaySyncedAt: user.lastPlaySyncedAt,
            lastPlaySyncedAtFormatted: user.lastPlaySyncedAt
              ? user.lastPlaySyncedAt.toISOString()
              : "never",
            note: "Always fetching latest 50 tracks (no after timestamp filter)",
            userId,
          },
          null,
          2,
        ),
      );
      this.logger.log(`Spotify API response written to ${debugFile}`);

      if (!recentlyPlayed || recentlyPlayed.length === 0) {
        this.logger.log(`No new plays for user ${userId}`);
        return { newPlaysCount: 0 };
      }

      this.logger.log(
        `Processing ${recentlyPlayed.length} new plays for user ${userId}`,
      );

      let newPlaysCount = 0;
      let skippedNotInLibrary = 0;
      let skippedDuplicate = 0;
      let mostRecentPlayTimestamp: Date | null = null;

      for (const item of recentlyPlayed) {
        try {
          const playedAt = new Date(item.played_at);
          const trackName = `${item.track.artists?.[0]?.name || "Unknown"} - ${item.track.name}`;
          const isrc = item.track.external_ids?.isrc;
          const spotifyTrackId = SpotifyService.getOriginalTrackId(item.track);

          // Track the most recent play timestamp
          if (!mostRecentPlayTimestamp || playedAt > mostRecentPlayTimestamp) {
            mostRecentPlayTimestamp = playedAt;
          }

          // Find the UserTrack - prefer ISRC matching (handles relinking)
          let userTrack;
          if (isrc) {
            // Primary: Match by ISRC (handles Spotify's relinking automatically)
            userTrack = await this.databaseService.userTrack.findFirst({
              select: { id: true, spotifyTrackId: true },
              where: { spotifyTrack: { isrc }, userId },
            });
            if (userTrack) {
              this.logger.log(
                `✓ Found in library by ISRC: ${trackName} [ISRC: ${isrc}]`,
              );
            }
          }

          if (!userTrack) {
            // Fallback: Match by Spotify ID (for tracks without ISRC or legacy data)
            userTrack = await this.databaseService.userTrack.findFirst({
              select: { id: true, spotifyTrackId: true },
              where: { spotifyTrack: { spotifyId: spotifyTrackId }, userId },
            });
            if (userTrack) {
              this.logger.log(
                `✓ Found in library by Spotify ID: ${trackName} [${spotifyTrackId}]`,
              );
            }
          }

          // Skip if track is not in user's library
          if (!userTrack) {
            this.logger.log(
              `⏭️  SKIPPED (not in library): ${trackName} [${spotifyTrackId}${isrc ? `, ISRC: ${isrc}` : ""}]`,
            );
            skippedNotInLibrary++;
            continue;
          }

          // Record play atomically: create PlayHistory + update UserTrack
          // P2002 errors (duplicate play) are silently skipped for idempotency
          try {
            await this.databaseService.$transaction([
              this.databaseService.playHistory.create({
                data: {
                  duration: null, // Spotify doesn't provide actual listen duration
                  playedAt,
                  userTrackId: userTrack.id,
                },
              }),
              this.databaseService.userTrack.update({
                data: {
                  lastPlayedAt: playedAt,
                  totalPlayCount: { increment: 1 },
                },
                where: { id: userTrack.id },
              }),
            ]);

            // Update artist/album aggregated stats
            await this.aggregationService.updateStatsForTrack(
              userId,
              userTrack.spotifyTrackId,
            );

            this.logger.log(`✅ IMPORTED: ${trackName}`);
            newPlaysCount++;
          } catch (error: unknown) {
            // P2002: Unique constraint violation (duplicate play)
            // Silently skip - this is expected for idempotency
            if (
              typeof error === "object" &&
              error !== null &&
              "code" in error &&
              error.code === "P2002"
            ) {
              this.logger.log(
                `⏭️  SKIPPED (duplicate): ${trackName} at ${playedAt.toISOString()}`,
              );
              skippedDuplicate++;
              continue;
            }

            // Log other errors but continue processing
            this.logger.error(
              `Failed to process play for track ${item.track.id}`,
              error,
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to process play for track ${item.track.id}`,
            error,
          );
          // Continue with next play
        }
      }

      // Update user's last sync timestamp to the most recent play we just synced
      if (mostRecentPlayTimestamp) {
        await this.databaseService.user.update({
          data: { lastPlaySyncedAt: mostRecentPlayTimestamp },
          where: { id: userId },
        });
      }

      this.logger.log(
        `Play sync completed for user ${userId}: ${newPlaysCount} new plays imported, ${skippedNotInLibrary} skipped (not in library), ${skippedDuplicate} skipped (duplicates)`,
      );

      return { newPlaysCount };
    } catch (error) {
      this.logger.error(
        `Play sync failed for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
