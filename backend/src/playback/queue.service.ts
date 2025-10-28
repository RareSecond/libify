import { Injectable, Logger } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { TrackService } from '../library/track.service';
import { ContextType } from './types/context-type.enum';

export interface PlayContext {
  contextId?: string;
  contextName?: string;
  contextType: ContextType;
  shuffle?: boolean;
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
    this.logger.log(
      `Building queue for user ${userId} with limit ${limit}`,
      context,
    );

    let trackUris: string[] = [];

    switch (context.contextType) {
      case ContextType.ALBUM:
        // Get album tracks
        if (context.contextId) {
          trackUris = await this.getAlbumTracks(
            userId,
            context.contextId,
            context.shuffle,
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
          );
        }
        break;

      case ContextType.LIBRARY:
        // Get user tracks with limit
        trackUris = await this.trackService.getTracksForPlay(userId, {
          pageSize: limit,
          shouldShuffle: context.shuffle,
        });
        break;

      case ContextType.PLAYLIST:
        // Get playlist tracks
        if (context.contextId) {
          trackUris = await this.getPlaylistTracks(userId, context.contextId);
        }
        break;

      case ContextType.SMART_PLAYLIST:
        // Get smart playlist tracks
        if (context.contextId) {
          trackUris = await this.getSmartPlaylistTracks(
            userId,
            context.contextId,
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

    // Apply limit
    const limitedTracks = trackUris.slice(0, limit);

    const duration = Date.now() - startTime;
    this.logger.log(
      `Built queue with ${limitedTracks.length} tracks in ${duration}ms`,
    );

    return limitedTracks;
  }

  private async getAlbumTracks(
    userId: string,
    albumId: string,
    shuffle?: boolean,
  ): Promise<string[]> {
    const tracks = await this.database.spotifyTrack.findMany({
      orderBy: shuffle ? undefined : { trackNumber: 'asc' },
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
  ): Promise<string[]> {
    const tracks = await this.database.spotifyTrack.findMany({
      orderBy: shuffle ? undefined : { popularity: 'desc' },
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
