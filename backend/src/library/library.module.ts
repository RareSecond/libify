import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AggregationService } from './aggregation.service';
import { LibrarySyncService } from './library-sync.service';
import { LibraryController } from './library.controller';
import { SpotifyService } from './spotify.service';
import { TagService } from './tag.service';
import { TrackService } from './track.service';

@Module({
  controllers: [LibraryController],
  exports: [SpotifyService, LibrarySyncService],
  imports: [
    DatabaseModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'sync',
    }),
  ],
  providers: [
    SpotifyService,
    LibrarySyncService,
    TrackService,
    TagService,
    AggregationService,
  ],
})
export class LibraryModule {}
