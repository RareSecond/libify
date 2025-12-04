import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as fs from "fs";

import { ApiModule } from "./api.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(ApiModule);

  if (process.env.NODE_ENV === "development") {
    const config = new DocumentBuilder()
      .setTitle("Codex.fm API")
      .setDescription("Spotify library management API")
      .setVersion("0.0.1")
      .addTag("codex.fm")
      .build();

    const document = SwaggerModule.createDocument(app, config);

    const jsonString = JSON.stringify(document, null, 2);
    fs.writeFileSync("./swagger.json", jsonString);

    SwaggerModule.setup("api", app, document);
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
    const additionalUrls = process.env.ADDITIONAL_FRONTEND_URLS.split(",").map(
      (url) => url.trim(),
    );
    corsOrigins.push(...additionalUrls);
  }

  app.enableCors({ credentials: true, origin: corsOrigins });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on port ${port}`);
}
bootstrap();
