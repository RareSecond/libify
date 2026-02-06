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
   * Start a backfill job to enrich all tracks without audio features
   */
  async enqueueBackfill(): Promise<void> {
    await this.audioFeaturesQueue.add(
      "backfill",
      { all: true },
      {
        jobId: `backfill-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: { age: 86400, count: 10 },
      },
    );
    this.logger.log("Enqueued audio features backfill job");
  }
}
