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

        console.log('=== Redis Configuration Debug ===');
        console.log(
          '[Redis Config] REDIS_URL from ConfigService:',
          redisUrl ? '***SET***' : 'NOT SET',
        );
        console.log(
          '[Redis Config] REDIS_URL from process.env:',
          process.env.REDIS_URL ? '***SET***' : 'NOT SET',
        );
        console.log('[Redis Config] Environment:', process.env.NODE_ENV);

        if (redisUrl) {
          // Parse Redis URL for external managed Redis services
          try {
            const url = new URL(redisUrl);
            const useTls = url.protocol === 'rediss:';

            console.log('[Redis Config] Using REDIS_URL connection');
            console.log('[Redis Config] Host:', url.hostname);
            console.log(
              '[Redis Config] Port:',
              url.port || (useTls ? 6380 : 6379),
            );
            console.log('[Redis Config] TLS:', useTls);
            console.log(
              '[Redis Config] Username:',
              url.username ? '***SET***' : 'NOT SET',
            );
            console.log(
              '[Redis Config] Password:',
              url.password ? '***SET***' : 'NOT SET',
            );

            const config = {
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

            console.log('[Redis Config] Configuration created successfully');
            console.log('=================================\n');
            return config;
          } catch (error) {
            console.error('[Redis Config] ERROR parsing REDIS_URL:', error);
            throw new Error(
              `Invalid REDIS_URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        }

        // Fallback to individual config values for local development
        const host = configService.get('redis.host');
        const port = configService.get('redis.port');
        const db = configService.get('redis.db');
        const tls = configService.get('redis.tls');

        console.log('[Redis Config] Using fallback individual config values');
        console.log('[Redis Config] Host:', host);
        console.log('[Redis Config] Port:', port);
        console.log('[Redis Config] DB:', db);
        console.log('[Redis Config] TLS:', tls);

        const fallbackConfig = {
          connection: {
            db,
            enableReadyCheck: false,
            host,
            maxRetriesPerRequest: null,
            password: configService.get('redis.password'),
            port,
            tls: tls ? {} : undefined,
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

        console.log('[Redis Config] Fallback configuration created');
        console.log('=================================\n');
        return fallbackConfig;
      },
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
      name: 'sync',
    }),
    forwardRef(() => AuthModule),
    forwardRef(() => LibraryModule),
  ],
  providers: [SyncProcessor],
})
export class QueueModule {}
