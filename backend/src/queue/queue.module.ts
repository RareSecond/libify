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
      useFactory: (configService: ConfigService) => ({
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
      }),
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
