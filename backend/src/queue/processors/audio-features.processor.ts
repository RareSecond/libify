import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { AudioFeaturesQueueService } from "../../library/audio-features-queue.service";
import { LibrarySyncService } from "../../library/library-sync.service";

export interface AudioFeaturesJobData {
  all: true;
}

@Processor("audio-features", { sharedConnection: true })
export class AudioFeaturesProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioFeaturesProcessor.name);

  constructor(
    private librarySyncService: LibrarySyncService,
    private audioFeaturesQueueService: AudioFeaturesQueueService,
  ) {
    super();
  }

  async process(
    job: Job<AudioFeaturesJobData>,
  ): Promise<{ processed: number; updated: number }> {
    this.logger.log(`Audio features enrichment started (Job: ${job.id})`);

    try {
      const batchSize = 500;
      const result =
        await this.librarySyncService.syncAudioFeaturesGlobal(batchSize);

      await job.updateProgress(100);

      this.logger.log(
        `Audio features batch completed: ${result.tracksProcessed} processed, ${result.tracksUpdated} updated`,
      );

      // Self-chain if more tracks remain
      if (result.tracksProcessed > 0) {
        const status =
          await this.librarySyncService.getAudioFeaturesBackfillStatus();
        if (status.pending > 0) {
          this.logger.log(
            `${status.pending} tracks remaining, scheduling continuation job...`,
          );
          await this.audioFeaturesQueueService.enqueueBackfill();
        }
      }

      return {
        processed: result.tracksProcessed,
        updated: result.tracksUpdated,
      };
    } catch (error) {
      this.logger.error(
        `Audio features enrichment failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
