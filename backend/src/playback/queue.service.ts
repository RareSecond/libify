import { Injectable, Logger } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { TrackService } from '../library/track.service';
import { ContextType } from './types/context-type.enum';

export interface PlayContext {
  clickedIndex?: number;
  contextId?: string;
  contextName?: string;
  contextType: ContextType;
  deviceId?: string;
  pageNumber?: number;
  pageSize?: number;
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
    private readonly trackService: TrackService,
  ) {}

  async buildQueue(
    userId: string,
    context: PlayContext,
    limit = 200,
  ): Promise<string[]> {
    const startTime = Date.now();
    this.logger.log(`Building queue for user ${userId} with limit ${limit}`, {
      ...context,
      sortBy: context.sortBy || '(undefined)',
      sortOrder: context.sortOrder || '(undefined)',
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
          search: context.contextName, // contextName contains the search string
          shouldShuffle: context.shuffle,
          skip,
          sortBy: context.sortBy as
            | 'addedAt'
            | 'album'
            | 'artist'
            | 'duration'
            | 'lastPlayedAt'
            | 'rating'
            | 'title'
            | 'totalPlayCount'
            | undefined,
          sortOrder: context.sortOrder as 'asc' | 'desc' | undefined,
        });
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
    const tracks = await this.database.spotifyTrack.findMany({
      orderBy: shuffle ? undefined : { trackNumber: 'asc' },
      skip: shuffle ? 0 : skip,
      take: limit,
      where: {
        albumId,
        userTracks: {
          some: {
            userId,
          },
        },
      },
    });

    let trackUris = tracks.map((t) => `spotify:track:${t.spotifyId}`);

    if (shuffle) {
      trackUris = this.shuffleArray(trackUris);
    }

    return trackUris;
  }

  private async getArtistTracks(
    userId: string,
    artistId: string,
    shuffle?: boolean,
    skip = 0,
    limit = 200,
  ): Promise<string[]> {
    const tracks = await this.database.spotifyTrack.findMany({
      orderBy: shuffle ? undefined : { popularity: 'desc' },
      skip: shuffle ? 0 : skip,
      take: limit,
      where: {
        artistId,
        userTracks: {
          some: {
            userId,
          },
        },
      },
    });

    let trackUris = tracks.map((t) => `spotify:track:${t.spotifyId}`);

    if (shuffle) {
      trackUris = this.shuffleArray(trackUris);
    }

    return trackUris;
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
    _skip = 0,
    _limit = 200,
  ): Promise<string[]> {
    // This would evaluate smart playlist criteria
    // For now, return empty array
    this.logger.warn(
      `Smart playlist tracks not yet implemented for playlist ${smartPlaylistId}`,
    );
    return [];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
