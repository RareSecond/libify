import { Injectable, Logger } from "@nestjs/common";
import { sql } from "kysely";

import { DatabaseService } from "../database/database.service";
import { KyselyService } from "../database/kysely/kysely.service";
import { TrackService } from "../library/track.service";
import { PlaylistsService } from "../playlists/playlists.service";
import { ContextType } from "./types/context-type.enum";

export interface PlayContext {
  clickedIndex?: number;
  contextId?: string;
  contextType: ContextType;
  deviceId?: string;
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  shuffle?: boolean;
  sortBy?: string;
  sortOrder?: string;
  startPosition?: number;
  unratedOnly?: boolean;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly kysely: KyselyService,
    private readonly trackService: TrackService,
    private readonly playlistsService: PlaylistsService,
  ) {}

  async buildQueue(
    userId: string,
    context: PlayContext,
    limit = 200,
  ): Promise<{ offset: number; trackUris: string[] }> {
    const startTime = Date.now();
    this.logger.log(`Building queue for user ${userId} with limit ${limit}`, {
      ...context,
      sortBy: context.sortBy || "(undefined)",
      sortOrder: context.sortOrder || "(undefined)",
    });

    // Calculate offset for playback start position based on pagination
    let offset = 0;
    if (
      context.pageNumber !== undefined &&
      context.pageSize !== undefined &&
      context.clickedIndex !== undefined &&
      !context.shuffle // Don't apply offset for shuffle
    ) {
      offset =
        (context.pageNumber - 1) * context.pageSize + context.clickedIndex;
      this.logger.log(
        `Calculated offset: ${offset} (page ${context.pageNumber}, size ${context.pageSize}, index ${context.clickedIndex})`,
      );
    }

    let trackUris: string[] = [];

    switch (context.contextType) {
      case ContextType.ALBUM:
        // Get album tracks
        if (context.contextId) {
          trackUris = await this.getAlbumTracks(
            userId,
            context.contextId,
            context.shuffle,
            0,
            limit,
          );
        }
        break;

      case ContextType.ARTIST:
        // Get artist tracks
        if (context.contextId) {
          trackUris = await this.getArtistTracks(
            userId,
            context.contextId,
            context.shuffle,
            0,
            limit,
          );
        }
        break;

      case ContextType.LIBRARY:
        // Get user tracks - fetch from offset to build queue starting at clicked track
        trackUris = await this.trackService.getTracksForPlay(userId, {
          pageSize: limit,
          search: context.search,
          shouldShuffle: context.shuffle,
          skip: 0,
          sortBy: context.sortBy as
            | "addedAt"
            | "album"
            | "artist"
            | "duration"
            | "lastPlayedAt"
            | "rating"
            | "title"
            | "totalPlayCount"
            | undefined,
          sortOrder: context.sortOrder as "asc" | "desc" | undefined,
          unratedOnly: context.unratedOnly,
        });
        // Enforce the requested limit (getTracksForPlay may return up to 500 items)
        if (trackUris.length > limit) {
          trackUris = trackUris.slice(0, limit);
        }
        break;

      case ContextType.PLAYLIST:
        // Get playlist tracks
        if (context.contextId) {
          trackUris = await this.getPlaylistTracks(
            userId,
            context.contextId,
            context.shuffle,
            0,
            limit,
          );
        }
        break;

      case ContextType.SMART_PLAYLIST:
        // Get smart playlist tracks
        if (context.contextId) {
          trackUris = await this.getSmartPlaylistTracks(
            userId,
            context.contextId,
            context.shuffle,
            0,
            limit,
            context.sortBy,
            context.sortOrder as "asc" | "desc" | undefined,
          );
        }
        break;

      case ContextType.TRACK:
        // Single track - no offset needed
        if (context.contextId) {
          trackUris = [context.contextId];
          offset = 0;
        }
        break;
    }

    // Ensure offset doesn't exceed available tracks
    if (offset >= trackUris.length) {
      offset = 0;
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Built queue with ${trackUris.length} tracks in ${duration}ms (offset: ${offset})`,
    );

    return { offset, trackUris };
  }

  private async getAlbumTracks(
    userId: string,
    albumId: string,
    shuffle?: boolean,
    _skip = 0,
    limit = 200,
  ): Promise<string[]> {
    const db = this.kysely.database;

    // If shuffling, use RANDOM() to get truly random tracks from album
    if (shuffle) {
      const tracks = await db
        .selectFrom("SpotifyTrack as st")
        .innerJoin("UserTrack as ut", "st.id", "ut.spotifyTrackId")
        .select("st.spotifyId")
        .where("st.albumId", "=", albumId)
        .where("ut.userId", "=", userId)
        .where("ut.addedToLibrary", "=", true)
        .orderBy(sql`RANDOM()`)
        .limit(limit)
        .execute();

      return tracks
        .filter((t) => t.spotifyId)
        .map((t) => `spotify:track:${t.spotifyId}`);
    }

    // Non-shuffle: order by title ASC - MUST match track.service.ts:getAlbumTracks
    const tracks = await db
      .selectFrom("SpotifyTrack as st")
      .innerJoin("UserTrack as ut", "st.id", "ut.spotifyTrackId")
      .select("st.spotifyId")
      .where("st.albumId", "=", albumId)
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .orderBy("st.title", "asc")
      .limit(limit)
      .execute();

    return tracks
      .filter((t) => t.spotifyId)
      .map((t) => `spotify:track:${t.spotifyId}`);
  }

  private async getArtistTracks(
    userId: string,
    artistId: string,
    shuffle?: boolean,
    _skip = 0,
    limit = 200,
  ): Promise<string[]> {
    const db = this.kysely.database;

    // If shuffling, use RANDOM() to get truly random tracks from entire artist catalog
    if (shuffle) {
      const tracks = await db
        .selectFrom("SpotifyTrack as st")
        .innerJoin("UserTrack as ut", "st.id", "ut.spotifyTrackId")
        .select("st.spotifyId")
        .where("st.artistId", "=", artistId)
        .where("ut.userId", "=", userId)
        .where("ut.addedToLibrary", "=", true)
        .orderBy(sql`RANDOM()`)
        .limit(limit)
        .execute();

      return tracks
        .filter((t) => t.spotifyId)
        .map((t) => `spotify:track:${t.spotifyId}`);
    }

    // Non-shuffle: order by album name, then title - MUST match track.service.ts:getArtistTracks
    const tracks = await db
      .selectFrom("SpotifyTrack as st")
      .innerJoin("UserTrack as ut", "st.id", "ut.spotifyTrackId")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .select("st.spotifyId")
      .where("st.artistId", "=", artistId)
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .orderBy("sa.name", "asc")
      .orderBy("st.title", "asc")
      .limit(limit)
      .execute();

    return tracks
      .filter((t) => t.spotifyId)
      .map((t) => `spotify:track:${t.spotifyId}`);
  }

  private async getPlaylistTracks(
    userId: string,
    playlistId: string,
    shuffle?: boolean,
    skip = 0,
    limit = 200,
  ): Promise<string[]> {
    const db = this.kysely.database;

    // If shuffling, use RANDOM() to get truly random tracks from playlist
    if (shuffle) {
      const tracks = await db
        .selectFrom("TrackSource")
        .innerJoin("UserTrack", "UserTrack.id", "TrackSource.userTrackId")
        .innerJoin(
          "SpotifyTrack",
          "SpotifyTrack.id",
          "UserTrack.spotifyTrackId",
        )
        .where("UserTrack.userId", "=", userId)
        .where("TrackSource.sourceType", "=", "PLAYLIST")
        .where("TrackSource.sourceId", "=", playlistId)
        .select("SpotifyTrack.spotifyId")
        .orderBy(sql`RANDOM()`)
        .limit(limit)
        .execute();

      return tracks
        .filter((t) => t.spotifyId)
        .map((t) => `spotify:track:${t.spotifyId}`);
    }

    // Non-shuffle: order by createdAt to preserve playlist order
    const tracks = await db
      .selectFrom("TrackSource")
      .innerJoin("UserTrack", "UserTrack.id", "TrackSource.userTrackId")
      .innerJoin("SpotifyTrack", "SpotifyTrack.id", "UserTrack.spotifyTrackId")
      .where("UserTrack.userId", "=", userId)
      .where("TrackSource.sourceType", "=", "PLAYLIST")
      .where("TrackSource.sourceId", "=", playlistId)
      .select("SpotifyTrack.spotifyId")
      .orderBy("TrackSource.createdAt", "asc")
      .offset(skip)
      .limit(limit)
      .execute();

    return tracks
      .filter((t) => t.spotifyId)
      .map((t) => `spotify:track:${t.spotifyId}`);
  }

  private async getSmartPlaylistTracks(
    userId: string,
    smartPlaylistId: string,
    shuffle?: boolean,
    skip = 0,
    limit = 200,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<string[]> {
    try {
      // Use PlaylistsService which has full criteria evaluation logic
      const allTracks = await this.playlistsService.getTracksForPlay(
        userId,
        smartPlaylistId,
        shuffle || false,
        sortBy,
        sortOrder,
      );

      // Apply skip and limit to match pagination
      return allTracks.slice(skip, skip + limit);
    } catch (error) {
      this.logger.error(
        `Failed to get smart playlist tracks for ${smartPlaylistId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }
}
