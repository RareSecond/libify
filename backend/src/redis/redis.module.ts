import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

/**
 * Global Redis module that provides a shared IORedis instance.
 *
 * This module creates a single Redis connection that can be shared across
 * the application, significantly reducing the number of open connections.
 *
 * BullMQ creates separate connections by default for each Queue and Worker.
 * By providing a shared IORedis instance, we can reduce connection count from
 * ~19 to ~7 connections.
 */
@Global()
@Module({
  exports: [REDIS_CLIENT],
  providers: [
    {
      inject: [ConfigService],
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService): Redis => {
        const redisUrl = configService.get<string>("REDIS_URL");

        if (redisUrl) {
          // Parse Redis URL for external managed Redis services
          try {
            const url = new URL(redisUrl);
            const useTls = url.protocol === "rediss:";

            return new Redis({
              enableReadyCheck: false,
              host: url.hostname,
              lazyConnect: false,
              maxRetriesPerRequest: null, // Required for BullMQ
              password: url.password || undefined,
              port: parseInt(url.port) || (useTls ? 6380 : 6379),
              tls: useTls
                ? {
                    rejectUnauthorized:
                      configService.get("REDIS_TLS_REJECT_UNAUTHORIZED") !==
                      "false",
                    servername: url.hostname, // Required for SNI
                  }
                : undefined,
              username: url.username || undefined,
            });
          } catch (error) {
            throw new Error(
              `Invalid REDIS_URL format: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }

        // Fallback to individual config values for local development
        return new Redis({
          db: configService.get("redis.db"),
          enableReadyCheck: false,
          host: configService.get("redis.host"),
          lazyConnect: false,
          maxRetriesPerRequest: null, // Required for BullMQ
          password: configService.get("redis.password"),
          port: configService.get("redis.port"),
          tls: configService.get("redis.tls") ? {} : undefined,
        });
      },
    },
  ],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async onModuleDestroy() {
    try {
      await this.redisClient.quit();
      this.logger.log("Redis connection closed");
    } catch (error) {
      this.logger.error(
        `Error closing Redis connection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
