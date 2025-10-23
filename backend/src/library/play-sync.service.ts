import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { AuthService } from '../auth/auth.service';
import { DatabaseService } from '../database/database.service';
import { AggregationService } from './aggregation.service';
import { SpotifyService } from './spotify.service';

@Injectable()
export class PlaySyncService {
  private isSyncing = false;
  private readonly logger = new Logger(PlaySyncService.name);

  constructor(
    private databaseService: DatabaseService,
    private spotifyService: SpotifyService,
    private authService: AuthService,
    private aggregationService: AggregationService,
  ) {}

  /**
   * Cron job that runs every 100 minutes to sync recently played tracks from Spotify.
   * 50 tracks × 3 min average = ~150 minutes of listening, so 100 min provides overlap buffer.
   */
  @Cron('0 */100 * * * *', {
    name: 'syncRecentlyPlayed',
  })
  async syncRecentlyPlayedForAllUsers(): Promise<void> {
    // Prevent overlapping executions
    if (this.isSyncing) {
      this.logger.warn('Previous sync still running, skipping this execution');
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();
    this.logger.log('Starting play sync for all users');

    try {
      // Get all users
      const users = await this.databaseService.user.findMany({
        select: {
          email: true,
          id: true,
          spotifyRefreshToken: true,
        },
      });

      this.logger.log(`Found ${users.length} users to sync`);

      let successCount = 0;
      let errorCount = 0;

      // Process each user
      for (const user of users) {
        try {
          // Skip users without refresh tokens
          if (!user.spotifyRefreshToken) {
            this.logger.debug(
              `Skipping user ${user.email}: no refresh token`,
            );
            continue;
          }

          await this.syncRecentlyPlayedForUser(user.id);
          successCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(
            `Failed to sync plays for user ${user.email}`,
            error,
          );
          // Continue with next user
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Play sync completed in ${duration}ms. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error('Fatal error during play sync', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync recently played tracks for a single user
   */
  async syncRecentlyPlayedForUser(userId: string): Promise<void> {
    // Get valid access token (auto-refreshes if expired)
    const accessToken = await this.authService.getSpotifyAccessToken(userId);
    if (!accessToken) {
      this.logger.warn(
        `Cannot sync plays for user ${userId}: no valid access token`,
      );
      return;
    }

    // Get user's last sync timestamp
    const user = await this.databaseService.user.findUnique({
      select: { lastPlaySyncedAt: true },
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found`);
      return;
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
      return;
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

    if (newPlaysCount > 0) {
      this.logger.log(`Synced ${newPlaysCount} new plays for user ${userId}`);
    }
  }

  /**
   * Manual trigger for testing or immediate sync
   */
  async triggerManualSync(userId?: string): Promise<void> {
    if (userId) {
      this.logger.log(`Manual sync triggered for user ${userId}`);
      await this.syncRecentlyPlayedForUser(userId);
    } else {
      this.logger.log('Manual sync triggered for all users');
      await this.syncRecentlyPlayedForAllUsers();
    }
  }
}
