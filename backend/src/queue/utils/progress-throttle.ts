import { Job } from "bullmq";

interface ThrottledProgressOptions {
  minInterval?: number; // Minimum time between updates in ms
  minProgress?: number; // Minimum progress change required (0-100)
}

export class BatchProgress {
  private processedItems = 0;
  private throttledProgress: ThrottledProgress;
  private totalItems: number;

  constructor(
    job: Job,
    totalItems: number,
    options?: ThrottledProgressOptions,
  ) {
    this.totalItems = totalItems;
    this.throttledProgress = new ThrottledProgress(job, options);
  }

  async complete(): Promise<void> {
    await this.throttledProgress.update(100);
    await this.throttledProgress.flush();
  }

  async increment(count = 1): Promise<void> {
    this.processedItems += count;
    const progress = Math.min(
      100,
      Math.floor((this.processedItems / this.totalItems) * 100),
    );
    await this.throttledProgress.update(progress);
  }

  async setProcessed(count: number): Promise<void> {
    this.processedItems = count;
    const progress = Math.min(
      100,
      Math.floor((this.processedItems / this.totalItems) * 100),
    );
    await this.throttledProgress.update(progress);
  }
}

export class ThrottledProgress {
  private lastProgress = 0;
  private lastUpdateTime = 0;
  private pendingUpdate: NodeJS.Timeout | null = null;

  constructor(
    private job: Job,
    private options: ThrottledProgressOptions = {},
  ) {
    this.options.minInterval = options.minInterval ?? 1000; // Default 1 second
    this.options.minProgress = options.minProgress ?? 1; // Default 1% change
  }

  async flush(): Promise<void> {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
      this.pendingUpdate = null;
      await this.forceUpdate(this.lastProgress);
    }
  }

  async update(progress: number): Promise<void> {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    const progressChange = Math.abs(progress - this.lastProgress);

    // Always update if we're at 0% or 100%
    if (progress === 0 || progress === 100) {
      await this.forceUpdate(progress);
      return;
    }

    // Check if we should throttle this update
    if (
      timeSinceLastUpdate < this.options.minInterval! &&
      progressChange < this.options.minProgress!
    ) {
      // Schedule a pending update
      if (this.pendingUpdate) {
        clearTimeout(this.pendingUpdate);
      }

      this.pendingUpdate = setTimeout(() => {
        this.forceUpdate(progress);
      }, this.options.minInterval! - timeSinceLastUpdate);

      return;
    }

    await this.forceUpdate(progress);
  }

  private async forceUpdate(progress: number): Promise<void> {
    if (this.pendingUpdate) {
      clearTimeout(this.pendingUpdate);
      this.pendingUpdate = null;
    }

    await this.job.updateProgress(progress);
    this.lastUpdateTime = Date.now();
    this.lastProgress = progress;
  }
}
