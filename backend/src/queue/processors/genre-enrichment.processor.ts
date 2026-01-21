import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { GenreEnrichmentService } from "../../library/genre-enrichment.service";

export interface GenreEnrichmentJobData {
  all?: boolean; // Backfill all unenriched tracks
  trackIds?: string[]; // Specific track IDs to enrich
  userId?: string; // Enrich unenriched tracks for a specific user
}

@Processor("genre-enrichment", { sharedConnection: true })
export class GenreEnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(GenreEnrichmentProcessor.name);

  constructor(private genreEnrichmentService: GenreEnrichmentService) {
    super();
  }

  async process(
    job: Job<GenreEnrichmentJobData>,
  ): Promise<{ failed: number; success: number }> {
    const { all, trackIds, userId } = job.data;

    this.logger.log(
      `🎵 Genre enrichment started (Job: ${job.id}, type: ${all ? "backfill" : userId ? "user" : "specific"})`,
    );

    try {
      let idsToEnrich: string[] = [];

      if (trackIds && trackIds.length > 0) {
        // Enrich specific tracks
        idsToEnrich = trackIds;
      } else if (userId) {
        // Enrich unenriched tracks for a user
        idsToEnrich =
          await this.genreEnrichmentService.getUnenrichedTrackIdsForUser(
            userId,
            1000,
          );
      } else if (all) {
        // Backfill - get all unenriched tracks
        idsToEnrich =
          await this.genreEnrichmentService.getUnenrichedTrackIds(1000);
      }

      if (idsToEnrich.length === 0) {
        this.logger.log("No tracks to enrich");
        return { failed: 0, success: 0 };
      }

      this.logger.log(`Processing ${idsToEnrich.length} tracks for enrichment`);

      // Process tracks and update job progress
      let success = 0;
      let failed = 0;

      for (let i = 0; i < idsToEnrich.length; i++) {
        const trackId = idsToEnrich[i];
        const result = await this.genreEnrichmentService.enrichTrack(trackId);

        if (result) {
          success++;
        } else {
          failed++;
        }

        // Update progress every 10 tracks
        if (i % 10 === 0) {
          const progress = Math.round((i / idsToEnrich.length) * 100);
          await job.updateProgress(progress);
        }
      }

      await job.updateProgress(100);

      this.logger.log(
        `Genre enrichment completed: ${success} success, ${failed} failed`,
      );

      // If this was a backfill and there are more tracks, enqueue another job
      if (all && success > 0) {
        const remainingIds =
          await this.genreEnrichmentService.getUnenrichedTrackIds(1);
        if (remainingIds.length > 0) {
          this.logger.log(
            "More tracks to enrich, scheduling continuation job...",
          );
          // The queue service will handle re-enqueueing
        }
      }

      return { failed, success };
    } catch (error) {
      this.logger.error(
        `Genre enrichment failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
