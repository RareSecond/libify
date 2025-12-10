import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

import { EncryptionModule } from "./common/encryption/encryption.module";
import authConfig, { authValidationSchema } from "./config/auth.config";
import redisConfig, { redisValidationSchema } from "./config/redis.config";
import { DatabaseModule } from "./database/database.module";
import { LibraryModule } from "./library/library.module";
import { PlaylistsModule } from "./playlists/playlists.module";
import { QueueModule } from "./queue/queue.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, redisConfig],
      validationSchema: Joi.object()
        .concat(authValidationSchema)
        .concat(redisValidationSchema),
    }),
    RedisModule, // Shared Redis connection for reduced connection count
    DatabaseModule,
    EncryptionModule,
    LibraryModule,
    PlaylistsModule,
    QueueModule, // Worker module includes QueueModule for processing jobs
    // Note: AuthModule and HealthModule are excluded as they're API-specific
  ],
})
export class WorkerModule {}
