import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";

import { GenreEnrichmentJobData } from "../queue/processors/genre-enrichment.processor";

@Injectable()
export class GenreQueueService {
  private readonly logger = new Logger(GenreQueueService.name);

  constructor(
    @InjectQueue("genre-enrichment")
    private readonly genreEnrichmentQueue: Queue<GenreEnrichmentJobData>,
  ) {}

  /**
   * Start a backfill job to enrich all tracks without genres
   */
  async enqueueBackfill(): Promise<void> {
    await this.genreEnrichmentQueue.add(
      "backfill",
      { all: true },
      {
        // Only allow one backfill job at a time
        jobId: "backfill",
        // Remove completed jobs so the same jobId can be reused
        removeOnComplete: true,
        removeOnFail: { age: 86400, count: 10 },
      },
    );
    this.logger.log("Enqueued genre backfill job");
  }

  /**
   * Enqueue a single track for genre enrichment
   */
  async enqueueTrack(trackId: string): Promise<void> {
    await this.genreEnrichmentQueue.add(
      "enrich-track",
      { trackIds: [trackId] },
      {
        jobId: `track-${trackId}`,
        // Remove completed jobs so the same jobId can be reused
        removeOnComplete: true,
        removeOnFail: { age: 86400, count: 100 },
      },
    );
    this.logger.debug(`Enqueued track ${trackId} for genre enrichment`);
  }

  /**
   * Enqueue multiple tracks for genre enrichment
   */
  async enqueueTracks(trackIds: string[]): Promise<void> {
    if (trackIds.length === 0) return;

    await this.genreEnrichmentQueue.add("enrich-tracks", { trackIds });
    this.logger.log(`Enqueued ${trackIds.length} tracks for genre enrichment`);
  }

  /**
   * Enqueue all unenriched tracks for a specific user
   */
  async enqueueUnenrichedTracksForUser(userId: string): Promise<void> {
    await this.genreEnrichmentQueue.add(
      "enrich-user-tracks",
      { userId },
      {
        // Dedupe by user ID - only one enrichment job per user at a time
        jobId: `user-${userId}`,
        // Remove completed jobs so the same jobId can be reused
        removeOnComplete: true,
        removeOnFail: { age: 86400, count: 100 },
      },
    );
    this.logger.log(
      `Enqueued genre enrichment job for user ${userId}'s unenriched tracks`,
    );
  }
}
