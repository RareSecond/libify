import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  app.enableCors({
    credentials: true,
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^https?:\/\/(?:[\w-]+\.)*codictive\.be$/,
      process.env.FRONTEND_URL,
    ].filter(Boolean),
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
