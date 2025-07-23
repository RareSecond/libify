import { Injectable, Logger } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { AggregationService } from './aggregation.service';
import { SpotifySavedAlbum } from './dto/spotify-album.dto';
import { SpotifyService, SpotifyTrackData } from './spotify.service';

export interface SyncResult {
  errors: string[];
  newAlbums: number;
  newTracks: number;
  totalAlbums: number;
  totalTracks: number;
  updatedAlbums: number;
  updatedTracks: number;
}

@Injectable()
export class LibrarySyncService {
  private readonly logger = new Logger(LibrarySyncService.name);

  constructor(
    private databaseService: DatabaseService,
    private spotifyService: SpotifyService,
    private aggregationService: AggregationService,
  ) {}

  async getSyncStatus(userId: string): Promise<{
    lastSync: Date | null;
    totalTracks: number;
    totalAlbums: number;
  }> {
    const totalTracks = await this.databaseService.userTrack.count({
      where: { userId },
    });

    const totalAlbums = await this.databaseService.userAlbum.count({
      where: { userId },
    });

    // Find the most recently updated track to determine last sync
    const lastUpdatedTrack = await this.databaseService.userTrack.findFirst({
      include: { spotifyTrack: true },
      orderBy: { addedAt: 'desc' },
      where: { userId },
    });

    return {
      lastSync: lastUpdatedTrack?.spotifyTrack.lastUpdated || null,
      totalTracks,
      totalAlbums,
    };
  }

  async syncRecentlyPlayed(userId: string, accessToken: string): Promise<void> {
    try {
      const recentTracks =
        await this.spotifyService.getRecentlyPlayed(accessToken);

      for (const { played_at, track } of recentTracks) {
        // Find the user track
        const userTrack = await this.databaseService.userTrack.findFirst({
          where: {
            spotifyTrack: {
              spotifyId: track.id,
            },
            userId,
          },
        });

        if (userTrack) {
          // Record play history
          await this.databaseService.playHistory.create({
            data: {
              duration: track.duration_ms,
              playedAt: new Date(played_at),
              userTrackId: userTrack.id,
            },
          });

          // Update play count and last played
          await this.databaseService.userTrack.update({
            data: {
              lastPlayedAt: new Date(played_at),
              totalPlayCount: { increment: 1 },
            },
            where: { id: userTrack.id },
          });
        }
      }

      this.logger.log(`Synced recently played tracks for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync recently played tracks for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  async syncUserAlbums(
    userId: string,
    accessToken: string,
  ): Promise<{
    errors: string[];
    newAlbums: number;
    totalAlbums: number;
    updatedAlbums: number;
  }> {
    const result = {
      errors: [] as string[],
      newAlbums: 0,
      totalAlbums: 0,
      updatedAlbums: 0,
    };

    try {
      this.logger.log(`Starting album sync for user ${userId}`);

      // Fetch all saved albums from Spotify
      const spotifyAlbums =
        await this.spotifyService.getAllUserSavedAlbums(accessToken);
      result.totalAlbums = spotifyAlbums.length;

      // Process albums in batches to avoid overwhelming the database
      const batchSize = 20; // Smaller batch size for albums since they're more complex
      for (let i = 0; i < spotifyAlbums.length; i += batchSize) {
        const batch = spotifyAlbums.slice(i, i + batchSize);
        await this.processAlbumBatch(userId, batch, result, accessToken);
      }

      this.logger.log(
        `Album sync completed for user ${userId}. Result: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to sync albums for user ${userId}`, error);
      result.errors.push(`Album sync failed: ${error.message}`);
      return result;
    }
  }

  async syncUserLibrary(
    userId: string,
    accessToken: string,
  ): Promise<SyncResult> {
    const result: SyncResult = {
      errors: [],
      newAlbums: 0,
      newTracks: 0,
      totalAlbums: 0,
      totalTracks: 0,
      updatedAlbums: 0,
      updatedTracks: 0,
    };

    try {
      this.logger.log(`Starting library sync for user ${userId}`);

      // Sync liked tracks
      this.logger.log(`Syncing liked tracks for user ${userId}`);
      const spotifyTracks =
        await this.spotifyService.getAllUserLibraryTracks(accessToken);
      result.totalTracks = spotifyTracks.length;

      // Process tracks in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < spotifyTracks.length; i += batchSize) {
        const batch = spotifyTracks.slice(i, i + batchSize);
        await this.processBatch(userId, batch, result, accessToken);
      }

      // Sync saved albums
      this.logger.log(`Syncing saved albums for user ${userId}`);
      const albumSyncResult = await this.syncUserAlbums(userId, accessToken);
      
      // Merge album sync results
      result.newAlbums = albumSyncResult.newAlbums;
      result.totalAlbums = albumSyncResult.totalAlbums;
      result.updatedAlbums = albumSyncResult.updatedAlbums;
      result.errors.push(...albumSyncResult.errors);

      this.logger.log(
        `Library sync completed for user ${userId}. Result: ${JSON.stringify(result)}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to sync library for user ${userId}`, error);
      result.errors.push(`Library sync failed: ${error.message}`);
      return result;
    }
  }

  private async processAlbumBatch(
    userId: string,
    albums: SpotifySavedAlbum[],
    result: {
      errors: string[];
      newAlbums: number;
      totalAlbums: number;
      updatedAlbums: number;
    },
    accessToken: string,
  ): Promise<void> {
    // Collect all unique artist IDs from this batch
    const uniqueArtistIds = new Set<string>();
    albums.forEach(({ album }) => {
      if (album.artists[0]?.id) {
        uniqueArtistIds.add(album.artists[0].id);
      }
    });

    // Fetch all artist data in batch
    const artistsData = await this.spotifyService.getMultipleArtists(
      accessToken,
      Array.from(uniqueArtistIds),
    );

    // Create a map for quick lookup
    const artistMap = new Map(artistsData.map((artist) => [artist.id, artist]));

    for (const savedAlbum of albums) {
      try {
        // Create or update the Spotify entities (artist, album, tracks)
        const { albumId, trackIds } =
          await this.aggregationService.createOrUpdateAlbumEntities(
            savedAlbum,
            artistMap,
          );

        // Check if UserAlbum already exists
        const existingUserAlbum =
          await this.databaseService.userAlbum.findUnique({
            where: {
              userId_albumId: {
                albumId,
                userId,
              },
            },
          });

        if (!existingUserAlbum) {
          // Create new UserAlbum
          await this.databaseService.userAlbum.create({
            data: {
              albumId,
              firstAddedAt: new Date(savedAlbum.added_at),
              userId,
            },
          });
          result.newAlbums++;
        } else {
          result.updatedAlbums++;
        }

        // Create UserTrack entries for each track in the album
        for (const spotifyTrackId of trackIds) {
          const existingUserTrack =
            await this.databaseService.userTrack.findUnique({
              where: {
                userId_spotifyTrackId: {
                  spotifyTrackId,
                  userId,
                },
              },
            });

          if (!existingUserTrack) {
            await this.databaseService.userTrack.create({
              data: {
                addedAt: new Date(savedAlbum.added_at),
                spotifyTrackId,
                userId,
              },
            });
          }
        }

        // Update aggregated stats for the album
        await this.aggregationService.updateUserAlbumStats(userId, albumId);
      } catch (error) {
        this.logger.error(
          `Failed to process album ${savedAlbum.album.id}`,
          error,
        );
        result.errors.push(
          `Album ${savedAlbum.album.name}: ${error.message}`,
        );
      }
    }
  }

  private async processBatch(
    userId: string,
    tracks: Array<{ added_at: string; track: SpotifyTrackData }>,
    result: SyncResult,
    accessToken: string,
  ): Promise<void> {
    // First, collect all unique artist IDs from this batch
    const uniqueArtistIds = new Set<string>();
    tracks.forEach(({ track }) => {
      if (track.artists[0]?.id) {
        uniqueArtistIds.add(track.artists[0].id);
      }
    });

    // Fetch all artist data in batch
    const artistsData = await this.spotifyService.getMultipleArtists(
      accessToken,
      Array.from(uniqueArtistIds),
    );

    // Create a map for quick lookup
    const artistMap = new Map(artistsData.map((artist) => [artist.id, artist]));

    for (const { added_at, track } of tracks) {
      try {
        // Create or update the Spotify entities (artist, album, track)
        const { trackId: spotifyTrackId } =
          await this.aggregationService.createOrUpdateSpotifyEntities(
            track,
            artistMap,
          );

        // Then, create or update the UserTrack
        const existingUserTrack =
          await this.databaseService.userTrack.findUnique({
            where: {
              userId_spotifyTrackId: {
                spotifyTrackId,
                userId,
              },
            },
          });

        if (!existingUserTrack) {
          await this.databaseService.userTrack.create({
            data: {
              addedAt: new Date(added_at),
              spotifyTrackId,
              userId,
            },
          });
          result.newTracks++;

          // Update aggregated stats for the new track
          await this.aggregationService.updateStatsForTrack(
            userId,
            spotifyTrackId,
          );
        } else {
          result.updatedTracks++;
        }
      } catch (error) {
        this.logger.error(`Failed to process track ${track.id}`, error);
        result.errors.push(`Track ${track.name}: ${error.message}`);
      }
    }
  }
}
