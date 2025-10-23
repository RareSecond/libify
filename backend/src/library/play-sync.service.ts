import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class PlaySyncService {
  private isSyncing = false;
  private readonly logger = new Logger(PlaySyncService.name);

  constructor(
    private databaseService: DatabaseService,
    @InjectQueue('play-sync') private playSyncQueue: Queue,
  ) {}

  /**
   * Enqueue a play sync job for a single user
   */
  async enqueueSyncForUser(userId: string): Promise<void> {
    await this.playSyncQueue.add(
      'sync-user-plays',
      { userId },
      {
        attempts: 3,
        backoff: {
          delay: 60000, // 1 minute
          type: 'exponential',
        },
        removeOnComplete: {
          age: 3600,
          count: 50,
        },
        removeOnFail: {
          age: 86400,
        },
      },
    );

    this.logger.log(`Enqueued play sync job for user ${userId}`);
  }

  /**
   * Cron job that runs every 100 minutes to enqueue play sync jobs for all users.
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
    this.logger.log('Enqueueing play sync jobs for all users');

    try {
      // Get all users with refresh tokens
      const users = await this.databaseService.user.findMany({
        select: {
          email: true,
          id: true,
        },
        where: {
          spotifyRefreshToken: { not: null },
        },
      });

      this.logger.log(`Found ${users.length} users to sync`);

      let enqueuedCount = 0;

      // Enqueue a job for each user
      for (const user of users) {
        try {
          await this.playSyncQueue.add(
            'sync-user-plays',
            { userId: user.id },
            {
              attempts: 3,
              backoff: {
                delay: 60000, // 1 minute
                type: 'exponential',
              },
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
            `Failed to enqueue play sync for user ${user.email}`,
            error,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Enqueued ${enqueuedCount} play sync jobs in ${duration}ms`,
      );
    } catch (error) {
      this.logger.error('Fatal error during play sync job enqueueing', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Manual trigger for testing or immediate sync
   */
  async triggerManualSync(userId?: string): Promise<void> {
    if (userId) {
      this.logger.log(`Manual sync triggered for user ${userId}`);
      await this.enqueueSyncForUser(userId);
    } else {
      this.logger.log('Manual sync triggered for all users');
      await this.syncRecentlyPlayedForAllUsers();
    }
  }
}
