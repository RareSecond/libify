import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import authConfig, { authValidationSchema } from './config/auth.config';
import { DatabaseModule } from './database/database.module';
import { LibraryModule } from './library/library.module';
import { PlaylistsModule } from './playlists/playlists.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
      validationSchema: authValidationSchema,
    }),
    DatabaseModule,
    EncryptionModule,
    AuthModule,
    LibraryModule,
    PlaylistsModule,
  ],
  providers: [AppService],
})
export class AppModule {}
