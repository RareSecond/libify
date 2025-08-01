import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { LibraryModule } from '../library/library.module';
import { SyncProcessor } from './processors/sync.processor';

@Module({
  exports: [BullModule],
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          // Parse Redis URL for external managed Redis services
          try {
            const url = new URL(redisUrl);
            const useTls = url.protocol === 'rediss:';

            return {
              connection: {
                enableReadyCheck: false,
                host: url.hostname,
                maxRetriesPerRequest: null,
                password: url.password || undefined,
                port: parseInt(url.port) || (useTls ? 6380 : 6379),
                tls: useTls
                  ? {
                      rejectUnauthorized:
                        configService.get('REDIS_TLS_REJECT_UNAUTHORIZED') !==
                        'false',
                    }
                  : undefined,
                username: url.username || undefined,
              },
              defaultJobOptions: {
                attempts: 3,
                backoff: {
                  delay: 5000,
                  type: 'exponential',
                },
                removeOnComplete: {
                  age: 3600, // Keep completed jobs for 1 hour
                  count: 100, // Keep last 100 completed jobs
                },
                removeOnFail: {
                  age: 86400, // Keep failed jobs for 24 hours
                },
              },
            };
          } catch (error) {
            console.error('Invalid REDIS_URL format:', error);
            throw new Error('Invalid REDIS_URL format');
          }
        }

        // Fallback to individual config values for local development
        return {
          connection: {
            db: configService.get('redis.db'),
            enableReadyCheck: false,
            host: configService.get('redis.host'),
            maxRetriesPerRequest: null,
            password: configService.get('redis.password'),
            port: configService.get('redis.port'),
            tls: configService.get('redis.tls') ? {} : undefined,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              delay: 5000,
              type: 'exponential',
            },
            removeOnComplete: {
              age: 3600, // Keep completed jobs for 1 hour
              count: 100, // Keep last 100 completed jobs
            },
            removeOnFail: {
              age: 86400, // Keep failed jobs for 24 hours
            },
          },
        };
      },
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 1, // Sync jobs should not auto-retry
        removeOnComplete: false, // Keep for progress tracking
        removeOnFail: false,
      },
      name: 'sync',
    }),
    forwardRef(() => AuthModule),
    forwardRef(() => LibraryModule),
  ],
  providers: [SyncProcessor],
})
export class QueueModule {}
