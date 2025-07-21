import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LibrarySyncService } from './library-sync.service';
import { LibraryController } from './library.controller';
import { SpotifyService } from './spotify.service';
import { TrackService } from './track.service';

@Module({
  controllers: [LibraryController],
  exports: [SpotifyService, LibrarySyncService],
  imports: [DatabaseModule, AuthModule],
  providers: [SpotifyService, LibrarySyncService, TrackService],
})
export class LibraryModule {}