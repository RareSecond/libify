import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

import { DatabaseService } from "../database/database.service";

@Injectable()
export class PlaylistSyncService implements OnModuleInit {
  private readonly logger = new Logger(PlaylistSyncService.name);

  constructor(
    private databaseService: DatabaseService,
    @InjectQueue("playlist-sync") private playlistSyncQueue: Queue,
  ) {}

  /**
   * Enqueue playlist sync jobs for all users with synced playlists
   * Called by the daily repeatable Bull job or manually
   */
  async enqueueAllUserSyncs(): Promise<number> {
    const startTime = Date.now();
    this.logger.log("Enqueueing playlist sync jobs for all users");

    try {
      // Get all users who have at least one synced smart playlist with autoSync enabled
      const usersWithSyncedPlaylists = await this.databaseService.user.findMany(
        {
          select: { id: true },
          where: {
            playlists: {
              some: { autoSync: true, spotifyPlaylistId: { not: null } },
            },
            spotifyRefreshToken: { not: null },
          },
        },
      );

      this.logger.log(
        `Found ${usersWithSyncedPlaylists.length} users with synced playlists`,
      );

      let enqueuedCount = 0;

      // Enqueue a job for each user
      for (const user of usersWithSyncedPlaylists) {
        try {
          await this.playlistSyncQueue.add(
            "sync-user-playlists",
            { userId: user.id },
            {
              attempts: 3,
              backoff: {
                delay: 60000, // 1 minute
                type: "exponential",
              },
              // Deterministic jobId ensures only one job per user exists in queue
              jobId: `playlist-sync-user-${user.id}`,
              removeOnComplete: {
                age: 3600, // Keep completed jobs for 1 hour
                count: 50,
              },
              removeOnFail: {
                age: 86400, // Keep failed jobs for 24 hours
              },
            },
          );
          enqueuedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to enqueue playlist sync for userId ${user.id}`,
            error,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Enqueued ${enqueuedCount} playlist sync jobs in ${duration}ms`,
      );

      return enqueuedCount;
    } catch (error) {
      this.logger.error(
        "Fatal error during playlist sync job enqueueing",
        error,
      );
      throw error;
    }
  }

  /**
   * Enqueue a playlist sync job for a single user
   */
  async enqueueSyncForUser(userId: string): Promise<void> {
    // Check if user has any synced playlists
    const syncedPlaylistCount = await this.databaseService.smartPlaylist.count({
      where: { autoSync: true, spotifyPlaylistId: { not: null }, userId },
    });

    if (syncedPlaylistCount === 0) {
      this.logger.debug(
        `Skipping playlist sync for user ${userId}: no synced playlists`,
      );
      return;
    }

    await this.playlistSyncQueue.add(
      "sync-user-playlists",
      { userId },
      {
        attempts: 3,
        backoff: {
          delay: 60000, // 1 minute
          type: "exponential",
        },
        // Deterministic jobId ensures only one job per user exists in queue
        jobId: `playlist-sync-user-${userId}`,
        removeOnComplete: { age: 3600, count: 50 },
        removeOnFail: { age: 86400 },
      },
    );

    this.logger.log(`Enqueued playlist sync job for user ${userId}`);
  }

  /**
   * Bootstrap repeatable job on module initialization
   */
  async onModuleInit() {
    // Create a repeatable job that runs daily
    // This job will enqueue individual sync jobs for each user
    await this.playlistSyncQueue.add(
      "sync-all-users",
      {},
      {
        // Single instance - only one scheduler runs across all app instances
        jobId: "playlist-sync-scheduler",
        repeat: {
          every: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        },
      },
    );

    this.logger.log("Playlist sync scheduler initialized (runs daily)");
  }

  /**
   * Manual trigger for testing or immediate sync
   */
  async triggerManualSync(userId?: string): Promise<void> {
    if (userId) {
      this.logger.log(`Manual playlist sync triggered for user ${userId}`);
      await this.enqueueSyncForUser(userId);
    } else {
      this.logger.log("Manual playlist sync triggered for all users");
      await this.enqueueAllUserSyncs();
    }
  }
}
