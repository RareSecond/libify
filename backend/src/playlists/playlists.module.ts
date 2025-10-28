import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { LibraryModule } from '../library/library.module';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';

@Module({
  controllers: [PlaylistsController],
  exports: [PlaylistsService],
  imports: [DatabaseModule, LibraryModule],
  providers: [PlaylistsService],
})
export class PlaylistsModule {}
