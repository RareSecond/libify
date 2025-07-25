import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Worker');

  try {
    // Create the application context without starting the HTTP server
    await NestFactory.createApplicationContext(AppModule);

    logger.log('Worker process started successfully');
    logger.log('Waiting for jobs...');

    // The worker will stay alive and process jobs
    // BullMQ processors are automatically started when the module is initialized
  } catch (error) {
    logger.error('Failed to start worker process', error);
    process.exit(1);
  }
}

bootstrap();
