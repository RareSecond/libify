import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';

import { ApiModule } from './api.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Log environment configuration for debugging
  logger.log('=== Environment Configuration ===');
  logger.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  logger.log(`PORT: ${process.env.PORT}`);
  logger.log(`APP_URL: ${process.env.APP_URL}`);
  logger.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
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
  logger.log('--- Authentication ---');
  logger.log(
    `JWT_SECRET: ${process.env.JWT_SECRET ? `***SET*** (length: ${process.env.JWT_SECRET.length})` : 'NOT SET'}`,
  );
  logger.log(`JWT_EXPIRES_IN: ${process.env.JWT_EXPIRES_IN || 'NOT SET'}`);
  logger.log(
    `ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? `***SET*** (length: ${process.env.ENCRYPTION_KEY.length})` : 'NOT SET'}`,
  );
  logger.log('--- Spotify OAuth ---');
  logger.log(
    `SPOTIFY_CLIENT_ID: ${process.env.SPOTIFY_CLIENT_ID ? '***SET***' : 'NOT SET'}`,
  );
  logger.log(
    `SPOTIFY_CLIENT_SECRET: ${process.env.SPOTIFY_CLIENT_SECRET ? '***SET***' : 'NOT SET'}`,
  );
  logger.log(
    `SPOTIFY_REDIRECT_URI: ${process.env.SPOTIFY_REDIRECT_URI || 'NOT SET'}`,
  );
  logger.log('=================================\n');

  const app = await NestFactory.create(ApiModule);

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Libify API')
      .setDescription('Spotify library management API')
      .setVersion('0.0.1')
      .addTag('libify')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    const jsonString = JSON.stringify(document, null, 2);
    fs.writeFileSync('./swagger.json', jsonString);

    SwaggerModule.setup('api', app, document);
  }

  const corsOrigins: (RegExp | string)[] = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^https?:\/\/(?:[\w-]+\.)*codictive\.be$/,
  ];

  // Add FRONTEND_URL if it exists
  if (process.env.FRONTEND_URL) {
    corsOrigins.push(process.env.FRONTEND_URL);
  }

  // Support multiple frontend URLs if needed (comma-separated)
  if (process.env.ADDITIONAL_FRONTEND_URLS) {
    const additionalUrls = process.env.ADDITIONAL_FRONTEND_URLS.split(',').map(
      (url) => url.trim(),
    );
    corsOrigins.push(...additionalUrls);
  }

  app.enableCors({
    credentials: true,
    origin: corsOrigins,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on port ${port}`);
}
bootstrap();
