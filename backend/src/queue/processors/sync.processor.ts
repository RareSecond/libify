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

    try {
      // Get fresh access token
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error('Failed to get Spotify access token');
      }

      // Progress callback that updates job progress directly (no throttling for now)
      const updateProgress = async (progress: SyncProgressDto) => {
        await job.updateProgress(progress);
        this.logger.log(
          `Sync progress - ${progress.phase}: ${progress.current}/${progress.total} (${progress.percentage}%) - ${progress.message}`,
        );
      };

      // Execute sync based on type
      if (syncType === 'quick') {
        // Quick sync: sync first 50 liked tracks and 10 albums
        const quickResult =
          await this.librarySyncService.syncRecentTracksQuick(
            userId,
            accessToken,
            updateProgress,
          );

        this.logger.log(
          `Quick sync completed for user ${userId}: ${quickResult.newTracks} new tracks, ${quickResult.newAlbums} new albums`,
        );

        return quickResult;
      } else {
        const result = await this.librarySyncService.syncUserLibrary(
          userId,
          accessToken,
          updateProgress,
        );

        this.logger.log(
          `Sync completed for user ${userId}: ${result.newTracks} new tracks, ${result.newAlbums} new albums`,
        );

        return result;
      }
    } catch (error) {
      this.logger.error(
        `Sync failed for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
