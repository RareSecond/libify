import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Mynance API')
      .setDescription('The Mynance API description')
      .setVersion('0.0.1')
      .addTag('mynance')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    const jsonString = JSON.stringify(document, null, 2);
    fs.writeFileSync('./swagger.json', jsonString);

    SwaggerModule.setup('api', app, document);
  }

  app.enableCors({
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^https?:\/\/(?:[\w-]+\.)*codictive\.be$/,
    ],
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
