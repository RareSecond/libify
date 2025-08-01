import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { WorkerModule } from './worker.module';

async function bootstrap() {
  const logger = new Logger('Worker');
  let app = null;

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
