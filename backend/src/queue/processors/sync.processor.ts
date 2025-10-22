import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { AuthService } from '../../auth/auth.service';
import { SyncProgressDto } from '../../library/dto/sync-progress-base.dto';
import { LibrarySyncService } from '../../library/library-sync.service';

export interface SyncJobData {
  syncType: 'full' | 'quick';
  userId: string;
}

/**
 * Throttles progress updates to avoid flooding Redis/logs
 * while ensuring the latest state is always preserved
 */
class ThrottledProgressUpdater {
  private lastUpdateTime = 0;
  private latestProgress: null | SyncProgressDto = null;
  private pendingUpdate: NodeJS.Timeout | null = null;

  constructor(
    private job: Job,
    private logger: Logger,
    private throttleMs = 500, // Default 500ms throttle
  ) {}

  /**
   * Force send the latest progress immediately (called on completion/error)
   */
  async flush(): Promise<void> {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
      this.pendingUpdate = null;
    }

    if (this.latestProgress) {
      await this.sendUpdate(this.latestProgress);
    }
  }

  /**
   * Update progress with throttling
   */
  async update(progress: SyncProgressDto): Promise<void> {
    this.latestProgress = progress;

    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    // Always send first update (0%) and final update (100%) immediately
    if (progress.percentage === 0 || progress.percentage === 100) {
      await this.sendUpdate(progress);
      return;
    }

    // If enough time has passed, send update immediately
    if (timeSinceLastUpdate >= this.throttleMs) {
      await this.sendUpdate(progress);
    } else {
      // Schedule a deferred update if not already scheduled
      if (!this.pendingUpdate) {
        const delay = this.throttleMs - timeSinceLastUpdate;
        this.pendingUpdate = setTimeout(async () => {
          // Clear pending state before awaiting to avoid races
          this.pendingUpdate = null;

          if (this.latestProgress) {
            try {
              await this.sendUpdate(this.latestProgress);
            } catch (error) {
              this.logger.error(
                `Failed to send deferred progress update: ${error.message}`,
                error.stack,
              );
            }
          }
        }, delay);
      }
      // If already scheduled, the pending update will pick up the latest state
    }
  }

  private async sendUpdate(progress: SyncProgressDto): Promise<void> {
    await this.job.updateProgress(progress);
    this.lastUpdateTime = Date.now();

    this.logger.log(
      `Sync progress - ${progress.phase}: ${progress.current}/${progress.total} (${progress.percentage}%) - ${progress.message}`,
    );
  }
}

@Processor('sync')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private librarySyncService: LibrarySyncService,
    private authService: AuthService,
  ) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<unknown> {
    const { syncType, userId } = job.data;
    this.logger.log(
      `Starting ${syncType} sync for user ${userId} (Job: ${job.id})`,
    );

    // Create throttled progress updater (500ms throttle)
    const throttledUpdater = new ThrottledProgressUpdater(
      job,
      this.logger,
      500,
    );

    try {
      // Get fresh access token
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error('Failed to get Spotify access token');
      }

      const updateProgress = async (progress: SyncProgressDto) => {
        await throttledUpdater.update(progress);
      };

      // Execute sync based on type
      let result;
      if (syncType === 'quick') {
        // Quick sync: sync first 50 liked tracks and 10 albums
        result = await this.librarySyncService.syncRecentTracksQuick(
          userId,
          accessToken,
          updateProgress,
        );

        this.logger.log(
          `Quick sync completed for user ${userId}: ${result.newTracks} new tracks, ${result.newAlbums} new albums`,
        );
      } else {
        result = await this.librarySyncService.syncUserLibrary(
          userId,
          accessToken,
          updateProgress,
        );

        this.logger.log(
          `Sync completed for user ${userId}: ${result.newTracks} new tracks, ${result.newAlbums} new albums`,
        );
      }

      // Ensure final progress is sent
      await throttledUpdater.flush();

      return result;
    } catch (error) {
      // Flush any pending progress updates before failing
      await throttledUpdater.flush();

      this.logger.error(
        `Sync failed for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
