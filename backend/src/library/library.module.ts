import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

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
  exports: [SpotifyService, LibrarySyncService],
  imports: [
    DatabaseModule,
    AuthModule,
    ScheduleModule.forRoot(),
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
    SyncProgressGateway,
    PlaySyncService,
  ],
})
export class LibraryModule {}
