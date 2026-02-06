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
   * Start a backfill job to enrich all tracks without genres.
   * Uses smart deduplication: skips if a job is already waiting,
   * but allows enqueue if a job is active (for self-chaining).
   */
  async enqueueBackfill(): Promise<void> {
    const waiting = await this.genreEnrichmentQueue.getWaitingCount();

    if (waiting > 0) {
      this.logger.debug("Genre backfill already queued, skipping enqueue");
      return;
    }

    await this.genreEnrichmentQueue.add(
      "backfill",
      { all: true },
      {
        jobId: `genre-backfill-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: { age: 86400, count: 10 },
      },
    );
    this.logger.log("Enqueued genre backfill job");
  }
}
