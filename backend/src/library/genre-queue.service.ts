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
        jobId: `backfill-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: { age: 86400, count: 10 },
      },
    );
    this.logger.log("Enqueued genre backfill job");
  }
}
