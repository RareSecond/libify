import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { WorkerModule } from './worker.module';

async function bootstrap() {
  const logger = new Logger('Worker');
  let app = null;

  // Log environment configuration for debugging
  logger.log('=== Worker Environment Configuration ===');
  logger.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  logger.log('--- Database ---');
  logger.log(
    `DATABASE_URL: ${process.env.DATABASE_URL ? `***SET*** (length: ${process.env.DATABASE_URL.length})` : 'NOT SET'}`,
  );
  logger.log('--- Redis ---');
  logger.log(
    `REDIS_URL: ${process.env.REDIS_URL ? `***SET*** (length: ${process.env.REDIS_URL.length})` : 'NOT SET'}`,
  );
  logger.log(`REDIS_HOST: ${process.env.REDIS_HOST || 'NOT SET'}`);
  logger.log(`REDIS_PORT: ${process.env.REDIS_PORT || 'NOT SET'}`);
  logger.log(
    `REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? '***SET***' : 'NOT SET'}`,
  );
  logger.log(`REDIS_DB: ${process.env.REDIS_DB || 'NOT SET'}`);
  logger.log(`REDIS_TLS: ${process.env.REDIS_TLS || 'NOT SET'}`);
  logger.log(
    `REDIS_TLS_REJECT_UNAUTHORIZED: ${process.env.REDIS_TLS_REJECT_UNAUTHORIZED || 'NOT SET'}`,
  );
  logger.log('--- Worker Config ---');
  logger.log(
    `SYNC_WORKER_CONCURRENCY: ${process.env.SYNC_WORKER_CONCURRENCY || 'NOT SET'}`,
  );
  logger.log('=================================\n');

  try {
    // Create the application context without starting the HTTP server
    app = await NestFactory.createApplicationContext(WorkerModule);

    logger.log('Worker process started successfully');
    logger.log('Waiting for jobs...');

    // The worker will stay alive and process jobs
    // BullMQ processors are automatically started when the module is initialized

    // Setup graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.log(`Received ${signal}, starting graceful shutdown...`);

      try {
        if (app) {
          await app.close();
          logger.log('Application context closed successfully');
        }
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error);
        process.exit(1);
      }
    };

    // Register signal handlers
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start worker process', error);
    process.exit(1);
  }
}

bootstrap();
