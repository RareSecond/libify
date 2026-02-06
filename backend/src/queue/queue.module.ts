import { BullModule } from "@nestjs/bullmq";
import { forwardRef, Module } from "@nestjs/common";
import Redis from "ioredis";

import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { LibraryModule } from "../library/library.module";
import { PlaylistsModule } from "../playlists/playlists.module";
import { REDIS_CLIENT, RedisModule } from "../redis/redis.module";
import { AudioFeaturesProcessor } from "./processors/audio-features.processor";
import { GenreEnrichmentProcessor } from "./processors/genre-enrichment.processor";
import { PlaySyncProcessor } from "./processors/play-sync.processor";
import { PlaylistSyncProcessor } from "./processors/playlist-sync.processor";
import { SyncProcessor } from "./processors/sync.processor";

@Module({
  exports: [BullModule],
  imports: [
    RedisModule,
    BullModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS_CLIENT],
      useFactory: (redisClient: Redis) => ({
        // Pass the shared IORedis instance instead of connection config
        // This significantly reduces the number of Redis connections
        connection: redisClient,
        defaultJobOptions: {
          attempts: 3,
          backoff: { delay: 5000, type: "exponential" },
          removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: {
            age: 86400, // Keep failed jobs for 24 hours
          },
        },
      }),
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 1, // Sync jobs should not auto-retry
        removeOnComplete: {
          age: 300, // Keep completed jobs for 5 minutes (reduced from 1 hour)
          count: 10, // Keep last 10 completed sync jobs
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 50, // Keep last 50 failed jobs
        },
      },
      name: "sync",
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
          delay: 60000, // 1 minute
          type: "exponential",
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 50,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 100,
        },
      },
      name: "play-sync",
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
          delay: 60000, // 1 minute
          type: "exponential",
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 50,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 100,
        },
      },
      name: "playlist-sync",
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
          delay: 60000, // 1 minute
          type: "exponential",
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 50,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 100,
        },
      },
      name: "genre-enrichment",
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
          delay: 60000, // 1 minute
          type: "exponential",
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 50,
        },
        removeOnFail: {
          age: 86400, // Keep failed jobs for 24 hours
          count: 100,
        },
      },
      name: "audio-features",
    }),
    DatabaseModule,
    forwardRef(() => AuthModule),
    forwardRef(() => LibraryModule),
    forwardRef(() => PlaylistsModule),
  ],
  providers: [
    SyncProcessor,
    PlaySyncProcessor,
    PlaylistSyncProcessor,
    GenreEnrichmentProcessor,
    AudioFeaturesProcessor,
  ],
})
export class QueueModule {}
