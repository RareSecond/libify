import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import authConfig, { authValidationSchema } from './config/auth.config';
import redisConfig, { redisValidationSchema } from './config/redis.config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { LibraryModule } from './library/library.module';
import { PlaylistsModule } from './playlists/playlists.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, redisConfig],
      validationSchema: Joi.object()
        .concat(authValidationSchema)
        .concat(redisValidationSchema),
    }),
    DatabaseModule,
    EncryptionModule,
    AuthModule,
    HealthModule,
    LibraryModule,
    PlaylistsModule,
    // QueueModule is intentionally excluded from API module
  ],
  providers: [AppService],
})
export class ApiModule {}
