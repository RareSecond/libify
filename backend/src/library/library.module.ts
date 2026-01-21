import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { AggregationService } from "./aggregation.service";
import { GenreEnrichmentService } from "./genre-enrichment.service";
import { GenreQueueService } from "./genre-queue.service";
import { LastFmService } from "./lastfm.service";
import { LibrarySyncService } from "./library-sync.service";
import { LibraryController } from "./library.controller";
import { PlaySyncService } from "./play-sync.service";
import { PlaylistSyncService } from "./playlist-sync.service";
import { ReccoBeatsService } from "./reccobeats.service";
import { SpotifyService } from "./spotify.service";
import { SyncProgressGateway } from "./sync-progress.gateway";
import { TagService } from "./tag.service";
import { TrackService } from "./track.service";

@Module({
  controllers: [LibraryController],
  exports: [
    SpotifyService,
    LibrarySyncService,
    AggregationService,
    PlaySyncService,
    PlaylistSyncService,
    TrackService,
    LastFmService,
    GenreEnrichmentService,
    GenreQueueService,
  ],
  imports: [
    DatabaseModule,
    AuthModule,
    BullModule.registerQueue({ name: "sync" }),
    BullModule.registerQueue({ name: "play-sync" }),
    BullModule.registerQueue({ name: "playlist-sync" }),
    BullModule.registerQueue({ name: "genre-enrichment" }),
  ],
  providers: [
    SpotifyService,
    ReccoBeatsService,
    LibrarySyncService,
    TrackService,
    TagService,
    AggregationService,
    SyncProgressGateway,
    PlaySyncService,
    PlaylistSyncService,
    LastFmService,
    GenreEnrichmentService,
    GenreQueueService,
  ],
})
export class LibraryModule {}
