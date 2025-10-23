import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { AuthService } from '../../auth/auth.service';
import { DatabaseService } from '../../database/database.service';
import { AggregationService } from '../../library/aggregation.service';
import { SpotifyService } from '../../library/spotify.service';

export interface PlaySyncJobData {
  userId: string;
}

@Processor('play-sync')
export class PlaySyncProcessor extends WorkerHost {
  private readonly logger = new Logger(PlaySyncProcessor.name);

  constructor(
    private databaseService: DatabaseService,
    private spotifyService: SpotifyService,
    private authService: AuthService,
    private aggregationService: AggregationService,
  ) {
    super();
  }

  async process(job: Job<PlaySyncJobData>): Promise<{ newPlaysCount: number }> {
    const { userId } = job.data;
    this.logger.log(`Starting play sync for user ${userId} (Job: ${job.id})`);

    try {
      // Get valid access token (auto-refreshes if expired)
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error('Failed to get Spotify access token');
      }

      // Get user's last sync timestamp
      const user = await this.databaseService.user.findUnique({
        select: { lastPlaySyncedAt: true },
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Convert lastPlaySyncedAt to Unix timestamp in milliseconds for Spotify API
      const afterTimestamp = user.lastPlaySyncedAt
        ? user.lastPlaySyncedAt.getTime()
        : undefined;

      // Fetch recently played tracks from Spotify (only plays after last sync)
      const recentlyPlayed = await this.spotifyService.getRecentlyPlayed(
        accessToken,
        50,
        afterTimestamp,
      );

      if (!recentlyPlayed || recentlyPlayed.length === 0) {
        this.logger.debug(`No new plays for user ${userId}`);
        return { newPlaysCount: 0 };
      }

      this.logger.debug(
        `Processing ${recentlyPlayed.length} new plays for user ${userId}`,
      );

      let newPlaysCount = 0;
      let mostRecentPlayTimestamp: Date | null = null;

      for (const item of recentlyPlayed) {
        try {
          const spotifyTrackId = item.track.id;
          const playedAt = new Date(item.played_at);

          // Track the most recent play timestamp
          if (!mostRecentPlayTimestamp || playedAt > mostRecentPlayTimestamp) {
            mostRecentPlayTimestamp = playedAt;
          }

          // Find the UserTrack for this Spotify track
          const userTrack = await this.databaseService.userTrack.findFirst({
            select: {
              id: true,
              spotifyTrackId: true,
            },
            where: {
              spotifyTrack: {
                spotifyId: spotifyTrackId,
              },
              userId,
            },
          });

          // Skip if track is not in user's library
          if (!userTrack) {
            continue;
          }

          // Create new play history entry
          await this.databaseService.playHistory.create({
            data: {
              duration: null, // Spotify doesn't provide actual listen duration
              playedAt,
              userTrackId: userTrack.id,
            },
          });

          // Update UserTrack play count and last played timestamp
          await this.databaseService.userTrack.update({
            data: {
              lastPlayedAt: playedAt,
              totalPlayCount: { increment: 1 },
            },
            where: { id: userTrack.id },
          });

          // Update artist/album aggregated stats
          await this.aggregationService.updateStatsForTrack(
            userId,
            userTrack.spotifyTrackId,
          );

          newPlaysCount++;
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
        `Play sync completed for user ${userId}: ${newPlaysCount} new plays`,
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
