import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AggregationService } from './aggregation.service';
import { LibrarySyncService } from './library-sync.service';
import { LibraryController } from './library.controller';
import { PlaySyncService } from './play-sync.service';
import { SpotifyService } from './spotify.service';
import { SyncProgressGateway } from './sync-progress.gateway';
import { TagService } from './tag.service';
import { TrackService } from './track.service';

@Module({
  controllers: [LibraryController],
  exports: [
    SpotifyService,
    LibrarySyncService,
    AggregationService,
    PlaySyncService,
  ],
  imports: [
    DatabaseModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'sync',
    }),
    BullModule.registerQueue({
      name: 'play-sync',
    }),
  ],
  providers: [
    SpotifyService,
    LibrarySyncService,
    TrackService,
    TagService,
    AggregationService,
    SyncProgressGateway,
    PlaySyncService,
  ],
})
export class LibraryModule {}
