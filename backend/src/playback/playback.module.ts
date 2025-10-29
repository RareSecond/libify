import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { LibraryModule } from '../library/library.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { PlaybackController } from './playback.controller';
import { PlaybackService } from './playback.service';
import { QueueService } from './queue.service';

@Module({
  controllers: [PlaybackController],
  exports: [PlaybackService, QueueService],
  imports: [DatabaseModule, AuthModule, LibraryModule, PlaylistsModule],
  providers: [PlaybackService, QueueService],
})
export class PlaybackModule {}
