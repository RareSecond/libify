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
  ): Promise<string[]> {
    const startTime = Date.now();
    this.logger.log(`Building queue for user ${userId} with limit ${limit}`, {
      ...context,
      sortBy: context.sortBy || "(undefined)",
      sortOrder: context.sortOrder || "(undefined)",
    });

    // Calculate skip amount based on pagination
    let skip = 0;
    if (
      context.pageNumber !== undefined &&
      context.pageSize !== undefined &&
      context.clickedIndex !== undefined &&
      !context.shuffle // Don't skip for shuffle
    ) {
      skip = (context.pageNumber - 1) * context.pageSize + context.clickedIndex;
      this.logger.log(
        `Calculated skip: ${skip} (page ${context.pageNumber}, size ${context.pageSize}, index ${context.clickedIndex})`,
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
            skip,
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
            skip,
            limit,
          );
        }
        break;

      case ContextType.LIBRARY:
        // Get user tracks with skip and limit
        trackUris = await this.trackService.getTracksForPlay(userId, {
          pageSize: limit,
          search: context.search,
          shouldShuffle: context.shuffle,
          skip,
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
            skip,
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
            skip,
            limit,
          );
        }
        break;

      case ContextType.TRACK:
        // Single track
        if (context.contextId) {
          trackUris = [context.contextId];
        }
        break;
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Built queue with ${trackUris.length} tracks in ${duration}ms (skip: ${skip})`,
    );

    return trackUris;
  }

  private async getAlbumTracks(
    userId: string,
    albumId: string,
    shuffle?: boolean,
    skip = 0,
    limit = 200,
  ): Promise<string[]> {
    // If shuffling, use RANDOM() to get truly random tracks from album
    if (shuffle) {
      const db = this.kysely.database;
      const tracks = await db
        .selectFrom("SpotifyTrack as st")
        .innerJoin("UserTrack as ut", "st.id", "ut.spotifyTrackId")
        .select("st.spotifyId")
        .where("st.albumId", "=", albumId)
        .where("ut.userId", "=", userId)
        .orderBy(sql`RANDOM()`)
        .limit(limit)
        .execute();

      return tracks
        .filter((t) => t.spotifyId)
        .map((t) => `spotify:track:${t.spotifyId}`);
    }

    // Non-shuffle: use track number ordering
    const tracks = await this.database.spotifyTrack.findMany({
      orderBy: { trackNumber: "asc" },
      skip,
      take: limit,
      where: { albumId, userTracks: { some: { userId } } },
    });

    return tracks.map((t) => `spotify:track:${t.spotifyId}`);
  }

  private async getArtistTracks(
    userId: string,
    artistId: string,
    shuffle?: boolean,
    skip = 0,
    limit = 200,
  ): Promise<string[]> {
    // If shuffling, use RANDOM() to get truly random tracks from entire artist catalog
    if (shuffle) {
      const db = this.kysely.database;
      const tracks = await db
        .selectFrom("SpotifyTrack as st")
        .innerJoin("UserTrack as ut", "st.id", "ut.spotifyTrackId")
        .select("st.spotifyId")
        .where("st.artistId", "=", artistId)
        .where("ut.userId", "=", userId)
        .orderBy(sql`RANDOM()`)
        .limit(limit)
        .execute();

      return tracks
        .filter((t) => t.spotifyId)
        .map((t) => `spotify:track:${t.spotifyId}`);
    }

    // Non-shuffle: use popularity ordering
    const tracks = await this.database.spotifyTrack.findMany({
      orderBy: { popularity: "desc" },
      skip,
      take: limit,
      where: { artistId, userTracks: { some: { userId } } },
    });

    return tracks.map((t) => `spotify:track:${t.spotifyId}`);
  }

  private async getPlaylistTracks(
    userId: string,
    playlistId: string,
    _skip = 0,
    _limit = 200,
  ): Promise<string[]> {
    // This would integrate with your playlist system
    // For now, return empty array
    this.logger.warn(
      `Playlist tracks not yet implemented for playlist ${playlistId}`,
    );
    return [];
  }

  private async getSmartPlaylistTracks(
    userId: string,
    smartPlaylistId: string,
    shuffle?: boolean,
    skip = 0,
    limit = 200,
  ): Promise<string[]> {
    try {
      // Use PlaylistsService which has full criteria evaluation logic
      const allTracks = await this.playlistsService.getTracksForPlay(
        userId,
        smartPlaylistId,
        shuffle || false,
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
