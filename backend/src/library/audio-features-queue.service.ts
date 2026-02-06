import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";

import { AudioFeaturesJobData } from "../queue/processors/audio-features.processor";

@Injectable()
export class AudioFeaturesQueueService {
  private readonly logger = new Logger(AudioFeaturesQueueService.name);

  constructor(
    @InjectQueue("audio-features")
    private readonly audioFeaturesQueue: Queue<AudioFeaturesJobData>,
  ) {}

  /**
   * Start a backfill job to enrich all tracks without audio features.
   * Uses smart deduplication: skips if a job is already waiting,
   * but allows enqueue if a job is active (for self-chaining).
   */
  async enqueueBackfill(): Promise<void> {
    const waiting = await this.audioFeaturesQueue.getWaitingCount();

    if (waiting > 0) {
      this.logger.debug(
        "Audio features backfill already queued, skipping enqueue",
      );
      return;
    }

    await this.audioFeaturesQueue.add(
      "backfill",
      { all: true },
      {
        jobId: `audio-features-backfill-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: { age: 86400, count: 10 },
      },
    );
    this.logger.log("Enqueued audio features backfill job");
  }
}
