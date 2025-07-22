import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';

@Module({
  controllers: [PlaylistsController],
  exports: [PlaylistsService],
  imports: [DatabaseModule],
  providers: [PlaylistsService],
})
export class PlaylistsModule {}