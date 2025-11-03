import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";

import { DatabaseService } from "../database/database.service";

@Injectable()
export class PlaySyncService implements OnModuleInit {
  private readonly logger = new Logger(PlaySyncService.name);

  constructor(
    private databaseService: DatabaseService,
    @InjectQueue("play-sync") private playSyncQueue: Queue,
  ) {}

  /**
   * Enqueue play sync jobs for all users
   * Called by the repeatable Bull job or manually
   */
  async enqueueAllUserSyncs(): Promise<number> {
    const startTime = Date.now();
    this.logger.log("Enqueueing play sync jobs for all users");

    try {
      // Get all users with refresh tokens
      const users = await this.databaseService.user.findMany({
        select: { id: true },
        where: { spotifyRefreshToken: { not: null } },
      });

      this.logger.log(`Found ${users.length} users to sync`);

      let enqueuedCount = 0;

      // Enqueue a job for each user
      for (const user of users) {
        try {
          await this.playSyncQueue.add(
            "sync-user-plays",
            { userId: user.id },
            {
              attempts: 3,
              backoff: {
                delay: 60000, // 1 minute
                type: "exponential",
              },
              // Deterministic jobId ensures only one job per user exists in queue
              // This prevents race conditions and duplicate play entries
              jobId: `play-sync-user-${user.id}`,
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
            `Failed to enqueue play sync for userId ${user.id}`,
            error,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Enqueued ${enqueuedCount} play sync jobs in ${duration}ms`,
      );

      return enqueuedCount;
    } catch (error) {
      this.logger.error("Fatal error during play sync job enqueueing", error);
      throw error;
    }
  }

  /**
   * Enqueue a play sync job for a single user
   */
  async enqueueSyncForUser(userId: string): Promise<void> {
    await this.playSyncQueue.add(
      "sync-user-plays",
      { userId },
      {
        attempts: 3,
        backoff: {
          delay: 60000, // 1 minute
          type: "exponential",
        },
        // Deterministic jobId ensures only one job per user exists in queue
        // This prevents race conditions and duplicate play entries
        jobId: `play-sync-user-${userId}`,
        removeOnComplete: { age: 3600, count: 50 },
        removeOnFail: { age: 86400 },
      },
    );

    this.logger.log(`Enqueued play sync job for user ${userId}`);
  }

  /**
   * Bootstrap repeatable job on module initialization
   */
  async onModuleInit() {
    // Create a repeatable job that runs every 100 minutes
    // This job will enqueue individual sync jobs for each user
    await this.playSyncQueue.add(
      "sync-all-users",
      {},
      {
        // Single instance - only one scheduler runs across all app instances
        jobId: "play-sync-scheduler",
        repeat: {
          every: 100 * 60 * 1000, // 100 minutes in milliseconds
        },
      },
    );

    this.logger.log("Play sync scheduler initialized (runs every 100 minutes)");
  }

  /**
   * Manual trigger for testing or immediate sync
   */
  async triggerManualSync(userId?: string): Promise<void> {
    if (userId) {
      this.logger.log(`Manual sync triggered for user ${userId}`);
      await this.enqueueSyncForUser(userId);
    } else {
      this.logger.log("Manual sync triggered for all users");
      await this.enqueueAllUserSyncs();
    }
  }
}
