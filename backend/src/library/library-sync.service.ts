import { Injectable, Logger } from '@nestjs/common';
import { SourceType } from '@prisma/client';

import { DatabaseService } from '../database/database.service';
import { KyselyService } from '../database/kysely/kysely.service';
import { AggregationService } from './aggregation.service';
import { SpotifySavedAlbum } from './dto/spotify-album.dto';
import {
  SyncItemCountsDto,
  SyncProgressCallback,
} from './dto/sync-progress-base.dto';
import {
  SpotifyPlaylist,
  SpotifyService,
  SpotifyTrackData,
} from './spotify.service';

export interface SyncResult {
  errors: string[];
  newAlbums: number;
  newTracks: number;
  playlistTracks?: number;
  totalAlbums: number;
  totalPlaylists?: number;
  totalTracks: number;
  updatedAlbums: number;
  updatedTracks: number;
}

interface WeightedSyncCounts {
  albums: number;
  albumTracks: number;
  playlists: number;
  playlistTracks: number;
  processedAlbums: number;
  processedPlaylists: number;
  processedTracks: number;
  tracks: number;
}

@Injectable()
export class LibrarySyncService {
  private readonly logger = new Logger(LibrarySyncService.name);
  private syncArtistCache = new Map<
    string,
    {
      genres: string[];
      id: string;
      images: Array<{ url: string }>;
      name: string;
      popularity: number;
    }
  >(); // Cache artists across batches during sync

  constructor(
    private databaseService: DatabaseService,
    private kyselyService: KyselyService,
    private spotifyService: SpotifyService,
    private aggregationService: AggregationService,
  ) {}

  async countSyncItems(
    userId: string,
    accessToken: string,
  ): Promise<SyncItemCountsDto> {
    this.logger.log(`Counting sync items for user ${userId}`);

    try {
      // Count tracks (first page gives us total)
      const tracksResponse = await this.spotifyService.getUserLibraryTracks(
        accessToken,
        1,
        0,
      );
      const trackCount = tracksResponse.total;

      // Count albums (first page gives us total)
      const albumsResponse = await this.spotifyService.getUserSavedAlbums(
        accessToken,
        1,
        0,
      );
      const albumCount = albumsResponse.total;

      // Count playlists (need to fetch all to get accurate count)
      const playlistsResponse = await this.spotifyService.getUserPlaylists(
        accessToken,
        50,
        0,
      );
      const playlistCount = playlistsResponse.total;

      // Slice 3: Count tracks within playlists for precision weighting
      let playlistTrackCount = 0;
      const allPlaylists =
        await this.spotifyService.getAllUserPlaylists(accessToken);
      for (const playlist of allPlaylists) {
        playlistTrackCount += playlist.tracks.total;
      }

      // Slice 3: Count tracks within albums (estimate: avg 10-12 tracks per album)
      // We use the album response total directly since we don't have track counts yet
      const albumTrackCount = albumCount > 0 ? albumCount * 11 : 0; // Conservative estimate

      this.logger.log(
        `Counted items for user ${userId}: ${trackCount} tracks, ${albumCount} albums (est. ${albumTrackCount} tracks), ${playlistCount} playlists (${playlistTrackCount} tracks)`,
      );

      return {
        albums: albumCount,
        albumTracks: albumTrackCount,
        playlists: playlistCount,
        playlistTracks: playlistTrackCount,
        tracks: trackCount,
      };
    } catch (error) {
      this.logger.error(`Failed to count sync items for user ${userId}`, error);
      throw error;
    }
  }

  async getSyncStatus(userId: string): Promise<{
    lastSync: Date | null;
    totalAlbums: number;
    totalTracks: number;
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
      totalAlbums,
      totalTracks,
    };
  }

  async getUserPlaylists(
    userId: string,
  ): Promise<Map<string, { lastSyncedAt: Date; snapshotId: string }>> {
    const userPlaylists = await this.databaseService.userPlaylist.findMany({
      select: { lastSyncedAt: true, snapshotId: true, spotifyId: true },
      where: { userId },
    });

    return new Map(
      userPlaylists.map((playlist) => [
        playlist.spotifyId,
        {
          lastSyncedAt: playlist.lastSyncedAt,
          snapshotId: playlist.snapshotId,
        },
      ]),
    );
  }

  async syncPlaylistTracks(
    userId: string,
    accessToken: string,
    onProgress?: SyncProgressCallback,
  ): Promise<{
    errors: string[];
    newTracks: number;
    skippedPlaylists: number;
    totalPlaylists: number;
    totalPlaylistTracks: number;
  }> {
    const result = {
      errors: [] as string[],
      newTracks: 0,
      skippedPlaylists: 0,
      totalPlaylists: 0,
      totalPlaylistTracks: 0,
    };

    try {
      this.logger.log(`Starting playlist track sync for user ${userId}`);

      // Get stored playlist snapshots
      const storedPlaylists = await this.getUserPlaylists(userId);
      this.logger.log(
        `Found ${storedPlaylists.size} stored playlists for user ${userId}`,
      );

      // Fetch all user playlists
      const playlists =
        await this.spotifyService.getAllUserPlaylists(accessToken);
      result.totalPlaylists = playlists.length;
      let processedPlaylists = 0;
      let skippedPlaylists = 0;

      // Process each playlist
      for (const playlist of playlists) {
        try {
          this.logger.log(
            `Processing playlist: ${playlist.name} (${playlist.id})`,
          );

          processedPlaylists++;

          // Check if playlist has changed by comparing snapshot IDs
          const storedPlaylist = storedPlaylists.get(playlist.id);
          if (
            storedPlaylist &&
            storedPlaylist.snapshotId === playlist.snapshot_id
          ) {
            this.logger.log(
              `Skipping unchanged playlist: ${playlist.name} (${playlist.id})`,
            );
            skippedPlaylists++;

            if (onProgress) {
              await onProgress({
                current: processedPlaylists,
                errors: result.errors,
                message: `Skipped unchanged playlist ${processedPlaylists}/${playlists.length}: ${playlist.name}`,
                percentage:
                  66 + Math.round((processedPlaylists / playlists.length) * 34), // 66-100% for playlists
                phase: 'playlists',
                total: playlists.length,
              });
            }
            continue;
          }

          // Update playlist metadata
          await this.upsertUserPlaylist(userId, playlist);

          // Skip empty playlists
          if (playlist.tracks.total === 0) {
            continue;
          }

          // Fetch tracks from the playlist
          const playlistTracks = await this.spotifyService.getPlaylistTracks(
            accessToken,
            playlist.id,
          );

          result.totalPlaylistTracks += playlistTracks.length;

          // Convert to the format expected by processBatch
          const tracksForProcessing = playlistTracks.map((item) => ({
            added_at: item.added_at,
            track: item.track,
          }));

          // Process tracks in batches using existing logic
          const batchSize = 100;
          const syncResult: SyncResult = {
            errors: [],
            newAlbums: 0,
            newTracks: 0,
            totalAlbums: 0,
            totalTracks: 0,
            updatedAlbums: 0,
            updatedTracks: 0,
          };

          for (let i = 0; i < tracksForProcessing.length; i += batchSize) {
            const batch = tracksForProcessing.slice(i, i + batchSize);
            await this.processBatch(
              userId,
              batch,
              syncResult,
              accessToken,
              SourceType.PLAYLIST,
              playlist.name,
              playlist.id,
            );
          }

          result.newTracks += syncResult.newTracks;
          result.errors.push(...syncResult.errors);

          // Report progress after each playlist, but only if we found new tracks or it's every 10th playlist
          if (
            onProgress &&
            (syncResult.newTracks > 0 || processedPlaylists % 10 === 0)
          ) {
            await onProgress({
              current: processedPlaylists,
              errors: result.errors,
              message: `Processed playlist ${processedPlaylists}/${playlists.length}: ${playlist.name}`,
              percentage:
                66 + Math.round((processedPlaylists / playlists.length) * 34), // 66-100% for playlists
              phase: 'playlists',
              total: playlists.length,
            });
          }
        } catch (error) {
          this.logger.error(
            `Failed to process playlist ${playlist.name} (${playlist.id})`,
            error,
          );
          result.errors.push(`Playlist ${playlist.name}: ${error.message}`);
        }
      }

      this.logger.log(
        `Playlist sync completed for user ${userId}. Processed: ${processedPlaylists}, Skipped: ${skippedPlaylists}, New tracks: ${result.newTracks}`,
      );
      result.skippedPlaylists = skippedPlaylists;
      return result;
    } catch (error) {
      this.logger.error(`Failed to sync playlists for user ${userId}`, error);
      result.errors.push(`Playlist sync failed: ${error.message}`);
      return result;
    }
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
          const playedAt = new Date(played_at);

          // Record play atomically: create PlayHistory + update UserTrack
          // P2002 errors (duplicate play) are silently skipped for idempotency
          try {
            await this.databaseService.$transaction([
              this.databaseService.playHistory.create({
                data: {
                  duration: track.duration_ms,
                  playedAt,
                  userTrackId: userTrack.id,
                },
              }),
              this.databaseService.userTrack.update({
                data: {
                  lastPlayedAt: playedAt,
                  totalPlayCount: { increment: 1 },
                },
                where: { id: userTrack.id },
              }),
            ]);
          } catch (error: unknown) {
            // P2002: Unique constraint violation (duplicate play)
            // Silently skip - this is expected for idempotency
            if (
              typeof error === 'object' &&
              error !== null &&
              'code' in error &&
              error.code === 'P2002'
            ) {
              continue; // Already recorded, skip to next track
            }
            throw error; // Rethrow other errors
          }
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

  async syncRecentTracksQuick(
    userId: string,
    accessToken: string,
    onProgress?: SyncProgressCallback,
  ): Promise<SyncResult> {
    const result: SyncResult = {
      errors: [],
      newAlbums: 0,
      newTracks: 0,
      playlistTracks: 0,
      totalAlbums: 0,
      totalPlaylists: 0,
      totalTracks: 0,
      updatedAlbums: 0,
      updatedTracks: 0,
    };

    try {
      this.logger.log(`Starting quick sync for user ${userId}`);
      this.syncArtistCache.clear();

      // Phase 1: Sync first 50 liked tracks (0-40%)
      if (onProgress) {
        await onProgress({
          current: 0,
          errors: [],
          message: 'Fetching liked tracks...',
          percentage: 0,
          phase: 'tracks',
          total: 100,
        });
      }

      const likedTracksPage = await this.spotifyService.getUserLibraryTracks(
        accessToken,
        50, // Limit to first 50 tracks
        0,
      );

      if (onProgress) {
        await onProgress({
          current: 10,
          errors: [],
          message: `Processing ${likedTracksPage.items.length} liked tracks...`,
          percentage: 10,
          phase: 'tracks',
          total: 100,
        });
      }

      // Process liked tracks
      await this.processBatchOptimized(
        userId,
        likedTracksPage.items,
        result,
        accessToken,
        SourceType.LIKED_SONGS,
      );

      result.totalTracks = likedTracksPage.items.length;

      if (onProgress) {
        await onProgress({
          current: result.totalTracks,
          errors: result.errors,
          message: `Synced ${result.totalTracks} liked tracks`,
          percentage: 40,
          phase: 'tracks',
          total: result.totalTracks,
        });
      }

      // Phase 2: Sync first 10 albums (40-70%)
      if (onProgress) {
        await onProgress({
          current: 0,
          errors: result.errors,
          message: 'Fetching saved albums...',
          percentage: 40,
          phase: 'albums',
          total: 100,
        });
      }

      const albumsPage = await this.spotifyService.getUserSavedAlbums(
        accessToken,
        10, // Limit to first 10 albums
        0,
      );

      if (onProgress) {
        await onProgress({
          current: 5,
          errors: result.errors,
          message: `Processing ${albumsPage.items.length} albums...`,
          percentage: 50,
          phase: 'albums',
          total: 100,
        });
      }

      // Process albums
      await this.processAlbumBatch(
        userId,
        albumsPage.items,
        result,
        accessToken,
      );

      result.totalAlbums = albumsPage.items.length;

      if (onProgress) {
        await onProgress({
          current: result.totalAlbums,
          errors: result.errors,
          message: `Synced ${result.newAlbums} albums`,
          percentage: 70,
          phase: 'albums',
          total: result.totalAlbums,
        });
      }

      // Phase 3: Sync first 3 playlists (70-100%)
      if (onProgress) {
        await onProgress({
          current: 0,
          errors: result.errors,
          message: 'Fetching playlists...',
          percentage: 70,
          phase: 'playlists',
          total: 100,
        });
      }

      const allPlaylists =
        await this.spotifyService.getAllUserPlaylists(accessToken);
      const playlistsToSync = allPlaylists.slice(0, 3); // Take first 3 playlists

      result.totalPlaylists = playlistsToSync.length;

      let processedPlaylists = 0;
      for (const playlist of playlistsToSync) {
        try {
          this.logger.log(
            `Processing playlist: ${playlist.name} (${playlist.id})`,
          );

          // Update playlist metadata
          await this.upsertUserPlaylist(userId, playlist);

          // Skip empty playlists
          if (playlist.tracks.total === 0) {
            processedPlaylists++;
            continue;
          }

          if (onProgress) {
            await onProgress({
              current: processedPlaylists,
              errors: result.errors,
              message: `Syncing playlist: ${playlist.name}...`,
              percentage:
                70 +
                Math.round((processedPlaylists / playlistsToSync.length) * 30),
              phase: 'playlists',
              total: playlistsToSync.length,
            });
          }

          // Fetch tracks from the playlist
          const playlistTracks = await this.spotifyService.getPlaylistTracks(
            accessToken,
            playlist.id,
          );

          result.playlistTracks += playlistTracks.length;

          // Convert to the format expected by processBatch
          const tracksForProcessing = playlistTracks.map((item) => ({
            added_at: item.added_at,
            track: item.track,
          }));

          // Process tracks in batches using existing logic
          const batchSize = 100;
          const playlistSyncResult: SyncResult = {
            errors: [],
            newAlbums: 0,
            newTracks: 0,
            totalAlbums: 0,
            totalTracks: 0,
            updatedAlbums: 0,
            updatedTracks: 0,
          };

          for (let i = 0; i < tracksForProcessing.length; i += batchSize) {
            const batch = tracksForProcessing.slice(i, i + batchSize);
            await this.processBatch(
              userId,
              batch,
              playlistSyncResult,
              accessToken,
              SourceType.PLAYLIST,
              playlist.name,
              playlist.id,
            );
          }

          result.newTracks += playlistSyncResult.newTracks;
          result.errors.push(...playlistSyncResult.errors);

          processedPlaylists++;
        } catch (error) {
          this.logger.error(
            `Failed to process playlist ${playlist.name} (${playlist.id})`,
            error,
          );
          result.errors.push(`Playlist ${playlist.name}: ${error.message}`);
        }
      }

      if (onProgress) {
        await onProgress({
          current: result.totalPlaylists,
          errors: result.errors,
          message: `Quick sync complete! ${result.newTracks} new tracks, ${result.newAlbums} new albums, ${result.totalPlaylists} playlists`,
          percentage: 100,
          phase: 'playlists',
          total: result.totalPlaylists,
        });
      }

      this.logger.log(
        `Quick sync completed for user ${userId}: ${result.newTracks} new tracks (${result.totalTracks} liked + ${result.playlistTracks} from playlists), ${result.newAlbums} new albums, ${result.totalPlaylists} playlists`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to quick sync for user ${userId}`, error);
      result.errors.push(`Quick sync failed: ${error.message}`);
      return result;
    }
  }

  async syncUserAlbums(
    userId: string,
    accessToken: string,
    onProgress?: SyncProgressCallback,
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

      // Stream albums to avoid memory issues
      await this.syncAlbumsStreaming(userId, accessToken, result, onProgress);

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
    onProgress?: SyncProgressCallback,
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
      // Clear artist cache at start of sync to avoid stale data across sync sessions
      this.syncArtistCache.clear();
      this.logger.log(`Starting library sync for user ${userId}`);

      // Slice 1 & 2: Pre-count items for weighted progress
      if (onProgress) {
        await onProgress({
          current: 0,
          errors: [],
          message: 'Counting items to sync...',
          percentage: 0,
          phase: 'tracks',
          total: 0,
        });
      }

      const counts = await this.countSyncItems(userId, accessToken);

      // Slice 3: Calculate total work with sub-item weighting
      const totalWork =
        counts.tracks + // Liked tracks
        (counts.albumTracks || counts.albums * 11) + // Album complexity
        (counts.playlistTracks || counts.playlists * 100); // Playlist complexity

      // Track weighted progress across all phases
      const weightedCounts: WeightedSyncCounts = {
        albums: counts.albums,
        albumTracks: counts.albumTracks || counts.albums * 11,
        playlists: counts.playlists,
        playlistTracks: counts.playlistTracks || counts.playlists * 100,
        processedAlbums: 0,
        processedPlaylists: 0,
        processedTracks: 0,
        tracks: counts.tracks,
      };

      // Helper function to calculate weighted percentage
      const calculateWeightedPercentage = (): number => {
        const processedWork =
          weightedCounts.processedTracks +
          weightedCounts.processedAlbums *
            (weightedCounts.albumTracks / Math.max(weightedCounts.albums, 1)) +
          weightedCounts.processedPlaylists *
            (weightedCounts.playlistTracks /
              Math.max(weightedCounts.playlists, 1));

        return totalWork > 0
          ? Math.min(Math.round((processedWork / totalWork) * 100), 100)
          : 0;
      };

      // Initial progress with breakdown
      if (onProgress) {
        await onProgress({
          breakdown: {
            albums: { processed: 0, total: weightedCounts.albums },
            playlists: { processed: 0, total: weightedCounts.playlists },
            tracks: { processed: 0, total: weightedCounts.tracks },
          },
          current: 0,
          errors: [],
          message: `Starting sync: ${counts.tracks} tracks, ${counts.albums} albums, ${counts.playlists} playlists`,
          percentage: 0,
          phase: 'tracks',
          total: weightedCounts.tracks,
        });
      }

      // Sync liked tracks using streaming for memory efficiency
      this.logger.log(`Syncing liked tracks for user ${userId}`);
      await this.syncTracksStreaming(
        userId,
        accessToken,
        result,
        onProgress
          ? async (progress) => {
              weightedCounts.processedTracks = progress.current;
              const percentage = calculateWeightedPercentage();
              await onProgress({
                ...progress,
                breakdown: {
                  albums: {
                    processed: weightedCounts.processedAlbums,
                    total: weightedCounts.albums,
                  },
                  playlists: {
                    processed: weightedCounts.processedPlaylists,
                    total: weightedCounts.playlists,
                  },
                  tracks: {
                    processed: weightedCounts.processedTracks,
                    total: weightedCounts.tracks,
                  },
                },
                percentage,
                phase: 'tracks',
              });
            }
          : undefined,
      );

      // Mark tracks complete
      weightedCounts.processedTracks = weightedCounts.tracks;

      // Update progress for albums phase
      if (onProgress) {
        await onProgress({
          breakdown: {
            albums: { processed: 0, total: weightedCounts.albums },
            playlists: {
              processed: weightedCounts.processedPlaylists,
              total: weightedCounts.playlists,
            },
            tracks: {
              processed: weightedCounts.processedTracks,
              total: weightedCounts.tracks,
            },
          },
          current: 0,
          errors: result.errors,
          message: 'Syncing saved albums...',
          percentage: calculateWeightedPercentage(),
          phase: 'albums',
          total: weightedCounts.albums,
        });
      }

      // Sync saved albums
      this.logger.log(`Syncing saved albums for user ${userId}`);
      const albumSyncResult = await this.syncUserAlbums(
        userId,
        accessToken,
        onProgress
          ? async (progress) => {
              weightedCounts.processedAlbums = progress.current;
              const percentage = calculateWeightedPercentage();
              await onProgress({
                ...progress,
                breakdown: {
                  albums: {
                    processed: weightedCounts.processedAlbums,
                    total: weightedCounts.albums,
                  },
                  playlists: {
                    processed: weightedCounts.processedPlaylists,
                    total: weightedCounts.playlists,
                  },
                  tracks: {
                    processed: weightedCounts.processedTracks,
                    total: weightedCounts.tracks,
                  },
                },
                percentage,
                phase: 'albums',
              });
            }
          : undefined,
      );

      // Merge album sync results
      result.newAlbums = albumSyncResult.newAlbums;
      result.totalAlbums = albumSyncResult.totalAlbums;
      result.updatedAlbums = albumSyncResult.updatedAlbums;
      result.errors.push(...albumSyncResult.errors);

      // Mark albums complete
      weightedCounts.processedAlbums = weightedCounts.albums;

      // Update progress for playlists phase
      if (onProgress) {
        await onProgress({
          breakdown: {
            albums: {
              processed: weightedCounts.processedAlbums,
              total: weightedCounts.albums,
            },
            playlists: { processed: 0, total: weightedCounts.playlists },
            tracks: {
              processed: weightedCounts.processedTracks,
              total: weightedCounts.tracks,
            },
          },
          current: 0,
          errors: result.errors,
          message: 'Syncing playlist tracks...',
          percentage: calculateWeightedPercentage(),
          phase: 'playlists',
          total: weightedCounts.playlists,
        });
      }

      // Sync playlist tracks
      this.logger.log(`Syncing playlist tracks for user ${userId}`);
      const playlistSyncResult = await this.syncPlaylistTracks(
        userId,
        accessToken,
        onProgress
          ? async (progress) => {
              weightedCounts.processedPlaylists = progress.current;
              const percentage = calculateWeightedPercentage();
              await onProgress({
                ...progress,
                breakdown: {
                  albums: {
                    processed: weightedCounts.processedAlbums,
                    total: weightedCounts.albums,
                  },
                  playlists: {
                    processed: weightedCounts.processedPlaylists,
                    total: weightedCounts.playlists,
                  },
                  tracks: {
                    processed: weightedCounts.processedTracks,
                    total: weightedCounts.tracks,
                  },
                },
                percentage,
                phase: 'playlists',
              });
            }
          : undefined,
      );

      // Merge playlist sync results
      result.newTracks += playlistSyncResult.newTracks;
      result.playlistTracks = playlistSyncResult.totalPlaylistTracks;
      result.totalPlaylists = playlistSyncResult.totalPlaylists;
      result.errors.push(...playlistSyncResult.errors);

      // Mark playlists complete
      weightedCounts.processedPlaylists = weightedCounts.playlists;

      // Final progress - update stats
      if (onProgress) {
        await onProgress({
          breakdown: {
            albums: {
              processed: weightedCounts.processedAlbums,
              total: weightedCounts.albums,
            },
            playlists: {
              processed: weightedCounts.processedPlaylists,
              total: weightedCounts.playlists,
            },
            tracks: {
              processed: weightedCounts.processedTracks,
              total: weightedCounts.tracks,
            },
          },
          current: result.totalTracks,
          errors: result.errors,
          message: 'Updating statistics...',
          percentage: 95,
          phase: 'playlists',
          total: result.totalTracks,
        });
      }

      // Run a single stats update for the entire user library at the end
      this.logger.log(`Updating all user stats for user ${userId}`);
      await this.aggregationService.updateAllUserStats(userId);

      // Final progress
      if (onProgress) {
        await onProgress({
          breakdown: {
            albums: {
              processed: weightedCounts.processedAlbums,
              total: weightedCounts.albums,
            },
            playlists: {
              processed: weightedCounts.processedPlaylists,
              total: weightedCounts.playlists,
            },
            tracks: {
              processed: weightedCounts.processedTracks,
              total: weightedCounts.tracks,
            },
          },
          current: result.totalTracks,
          errors: result.errors,
          message: 'Sync completed successfully!',
          percentage: 100,
          phase: 'playlists',
          total: result.totalTracks,
        });
      }

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

  async upsertUserPlaylist(
    userId: string,
    playlist: SpotifyPlaylist,
  ): Promise<void> {
    await this.databaseService.userPlaylist.upsert({
      create: {
        description: playlist.description,
        lastSyncedAt: new Date(),
        name: playlist.name,
        ownerId: playlist.owner.id,
        ownerName: playlist.owner.display_name || null,
        snapshotId: playlist.snapshot_id,
        spotifyId: playlist.id,
        totalTracks: playlist.tracks.total,
        userId,
      },
      update: {
        description: playlist.description,
        lastSyncedAt: new Date(),
        name: playlist.name,
        ownerName: playlist.owner.display_name || null,
        snapshotId: playlist.snapshot_id,
        totalTracks: playlist.tracks.total,
      },
      where: {
        userId_spotifyId: {
          spotifyId: playlist.id,
          userId,
        },
      },
    });
  }

  /**
   * Get artists from database first, only fetching from API if completely missing
   * This prevents unnecessary API calls for artists we already have
   */
  private async getOrFetchArtists(
    artistIds: string[],
    accessToken: string,
  ): Promise<
    Map<
      string,
      {
        genres: string[];
        id: string;
        images: Array<{ url: string }>;
        name: string;
        popularity: number;
      }
    >
  > {
    if (artistIds.length === 0) {
      return new Map();
    }

    const db = this.kyselyService.database;
    const artistMap = new Map();

    // Step 1: Check sync cache first (artists fetched in this sync session)
    const uncachedArtistIds: string[] = [];
    for (const artistId of artistIds) {
      if (this.syncArtistCache.has(artistId)) {
        artistMap.set(artistId, this.syncArtistCache.get(artistId));
      } else {
        uncachedArtistIds.push(artistId);
      }
    }

    if (uncachedArtistIds.length === 0) {
      this.logger.debug(
        `All ${artistIds.length} artists found in sync cache - no API calls needed`,
      );
      return artistMap;
    }

    // Step 2: Check database for remaining artists
    const existingArtists = await db
      .selectFrom('SpotifyArtist')
      .select(['spotifyId', 'name', 'genres', 'popularity', 'imageUrl'])
      .where('spotifyId', 'in', uncachedArtistIds)
      .execute();

    const foundInDb = new Set<string>();
    for (const artist of existingArtists) {
      const artistData = {
        genres: artist.genres,
        id: artist.spotifyId,
        images: artist.imageUrl ? [{ url: artist.imageUrl }] : [],
        name: artist.name,
        popularity: artist.popularity || 0,
      };
      artistMap.set(artist.spotifyId, artistData);
      this.syncArtistCache.set(artist.spotifyId, artistData);
      foundInDb.add(artist.spotifyId);
    }

    // Step 3: Only fetch from Spotify API if artist doesn't exist in database at all
    const needsApiFetch = uncachedArtistIds.filter((id) => !foundInDb.has(id));

    if (needsApiFetch.length > 0) {
      this.logger.log(
        `Fetching ${needsApiFetch.length} missing artists from Spotify API (out of ${artistIds.length} total)`,
      );
      try {
        const artistsData = await this.spotifyService.getMultipleArtists(
          accessToken,
          needsApiFetch,
        );

        for (const artist of artistsData) {
          artistMap.set(artist.id, artist);
          this.syncArtistCache.set(artist.id, artist);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch ${needsApiFetch.length} artists from API: ${error.message}`,
        );
      }
    } else {
      this.logger.debug(
        `All ${artistIds.length} artists found in database - no API calls needed`,
      );
    }

    return artistMap;
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

    // Use optimized artist fetching (cache + db + API only if needed)
    const artistMap = await this.getOrFetchArtists(
      Array.from(uniqueArtistIds),
      accessToken,
    );

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
            const userTrack = await this.databaseService.userTrack.create({
              data: {
                addedAt: new Date(savedAlbum.added_at),
                spotifyTrackId,
                userId,
              },
            });

            // Add source tracking for album
            await this.upsertTrackSource(
              userTrack.id,
              SourceType.ALBUM,
              savedAlbum.album.name,
              savedAlbum.album.id,
            );
          } else {
            // Track already exists, ensure source is recorded
            await this.upsertTrackSource(
              existingUserTrack.id,
              SourceType.ALBUM,
              savedAlbum.album.name,
              savedAlbum.album.id,
            );
          }
        }

        // Stats updates are now batched at the end of sync
        // await this.aggregationService.updateUserAlbumStats(userId, albumId);
      } catch (error) {
        this.logger.error(
          `Failed to process album ${savedAlbum.album.id}`,
          error,
        );
        result.errors.push(`Album ${savedAlbum.album.name}: ${error.message}`);
      }
    }
  }

  private async processBatch(
    userId: string,
    tracks: Array<{ added_at: string; track: SpotifyTrackData }>,
    result: SyncResult,
    accessToken: string,
    sourceType?: SourceType,
    sourceName?: string,
    sourceId?: string,
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
          const userTrack = await this.databaseService.userTrack.create({
            data: {
              addedAt: new Date(added_at),
              spotifyTrackId,
              userId,
            },
          });
          result.newTracks++;

          // Add source tracking if provided
          if (sourceType) {
            await this.upsertTrackSource(
              userTrack.id,
              sourceType,
              sourceName,
              sourceId,
            );
          }

          // Stats updates are now batched at the end of sync
          // await this.aggregationService.updateStatsForTrack(
          //   userId,
          //   spotifyTrackId,
          // );
        } else {
          result.updatedTracks++;

          // Track already exists, ensure source is recorded if provided
          if (sourceType) {
            await this.upsertTrackSource(
              existingUserTrack.id,
              sourceType,
              sourceName,
              sourceId,
            );
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process track ${track.id}`, error);
        result.errors.push(`Track ${track.name}: ${error.message}`);
      }
    }
  }

  /**
   * Optimized batch processing using Kysely for bulk operations
   * Eliminates the memory-heavy artist map creation
   */
  private async processBatchOptimized(
    userId: string,
    tracks: Array<{ added_at: string; track: SpotifyTrackData }>,
    result: SyncResult,
    accessToken: string,
    sourceType?: SourceType,
    sourceName?: string,
    sourceId?: string,
  ): Promise<void> {
    const db = this.kyselyService.database;

    // Extract unique IDs for batch processing
    const uniqueArtistIds = [
      ...new Set(tracks.map((t) => t.track.artists[0]?.id).filter(Boolean)),
    ];
    const uniqueTrackIds = [...new Set(tracks.map((t) => t.track.id))];

    // 1. Check what UserTracks already exist to avoid duplicate processing
    const [existingUserTracks, existingSpotifyTracks] = await Promise.all([
      db
        .selectFrom('UserTrack as ut')
        .innerJoin('SpotifyTrack as st', 'ut.spotifyTrackId', 'st.id')
        .select(['st.spotifyId'])
        .where('ut.userId', '=', userId)
        .where('st.spotifyId', 'in', uniqueTrackIds)
        .execute(),
      db
        .selectFrom('SpotifyTrack')
        .select(['spotifyId'])
        .where('spotifyId', 'in', uniqueTrackIds)
        .execute(),
    ]);

    const existingUserTrackIds = new Set(
      existingUserTracks.map((ut) => ut.spotifyId),
    );
    const existingSpotifyTrackIds = new Set(
      existingSpotifyTracks.map((st) => st.spotifyId),
    );

    // Build a map of spotifyId -> internal ID for existing tracks
    const spotifyTrackIdMap = new Map<string, string>();
    if (existingSpotifyTracks.length > 0) {
      const fullTrackData = await db
        .selectFrom('SpotifyTrack')
        .select(['id', 'spotifyId'])
        .where('spotifyId', 'in', Array.from(existingSpotifyTrackIds))
        .execute();

      for (const track of fullTrackData) {
        spotifyTrackIdMap.set(track.spotifyId, track.id);
      }
    }

    // 2. Use optimized artist fetching (cache + db + API only if needed)
    const artistMap = await this.getOrFetchArtists(
      uniqueArtistIds,
      accessToken,
    );

    // 3. Process each track with minimal memory usage
    for (const { added_at, track } of tracks) {
      try {
        let spotifyTrackId: string;

        // Only create Spotify metadata entities if track doesn't exist in database
        if (!existingSpotifyTrackIds.has(track.id)) {
          const { trackId } =
            await this.aggregationService.createOrUpdateSpotifyEntities(
              track,
              artistMap,
            );
          spotifyTrackId = trackId;
        } else {
          // Track metadata already exists, use cached ID
          spotifyTrackId = spotifyTrackIdMap.get(track.id)!;
        }

        // Create UserTrack only if it doesn't exist
        if (!existingUserTrackIds.has(track.id)) {
          const userTrack = await this.databaseService.userTrack.create({
            data: {
              addedAt: new Date(added_at),
              spotifyTrackId,
              userId,
            },
          });
          result.newTracks++;

          // Add source tracking if provided
          if (sourceType) {
            await this.upsertTrackSource(
              userTrack.id,
              sourceType,
              sourceName,
              sourceId,
            );
          }

          // Stats updates are now batched at the end of sync
          // await this.aggregationService.updateStatsForTrack(
          //   userId,
          //   spotifyTrackId,
          // );
        } else {
          result.updatedTracks++;

          // Track already exists, ensure source is recorded if provided
          if (sourceType) {
            const existingUserTrack =
              await this.databaseService.userTrack.findUnique({
                where: {
                  userId_spotifyTrackId: {
                    spotifyTrackId,
                    userId,
                  },
                },
              });

            if (existingUserTrack) {
              await this.upsertTrackSource(
                existingUserTrack.id,
                sourceType,
                sourceName,
                sourceId,
              );
            }
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process track ${track.id}`, error);
        result.errors.push(`Track ${track.name}: ${error.message}`);
      }
    }

    // Clear the artist map to free memory
    artistMap.clear();
  }

  /**
   * Memory-efficient streaming sync for user albums
   */
  private async syncAlbumsStreaming(
    userId: string,
    accessToken: string,
    result: {
      errors: string[];
      newAlbums: number;
      totalAlbums: number;
      updatedAlbums: number;
    },
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    const batchSize = 20; // Smaller batches for albums since they're more complex
    let batch: SpotifySavedAlbum[] = [];
    let totalProcessed = 0;
    let estimatedTotal = 0;
    const startTime = Date.now();

    // Get estimated total for progress calculation
    try {
      const firstPage = await this.spotifyService.getUserSavedAlbums(
        accessToken,
        1,
        0,
      );
      estimatedTotal = firstPage.total;
    } catch {
      this.logger.warn(
        'Could not get total album count for progress estimation',
      );
    }

    // Stream albums and process in batches
    for await (const album of this.spotifyService.streamUserSavedAlbums(
      accessToken,
    )) {
      batch.push(album);
      totalProcessed++;

      // Process batch when it reaches the desired size
      if (batch.length >= batchSize) {
        await this.processAlbumBatch(userId, batch, result, accessToken);
        batch = []; // Clear batch to free memory

        // Report progress
        if (onProgress && estimatedTotal > 0) {
          const elapsed = Date.now() - startTime;
          const itemsPerSecond = totalProcessed / (elapsed / 1000);
          const remaining = estimatedTotal - totalProcessed;
          const estimatedTimeRemaining = remaining / itemsPerSecond;

          await onProgress({
            current: totalProcessed,
            errors: result.errors,
            estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
            itemsPerSecond: Math.round(itemsPerSecond),
            message: `Processing albums: ${totalProcessed}/${estimatedTotal}`,
            percentage: 33 + Math.round((totalProcessed / estimatedTotal) * 33), // 33-66% for albums phase
            phase: 'albums',
            total: estimatedTotal,
          });
        }

        // Force garbage collection if available (for development)
        if (typeof global.gc === 'function') {
          try {
            global.gc();
          } catch (error) {
            this.logger.debug('Manual garbage collection failed:', error);
          }
        }
      }
    }

    // Process remaining albums in the last batch
    if (batch.length > 0) {
      await this.processAlbumBatch(userId, batch, result, accessToken);
    }

    result.totalAlbums = totalProcessed;
    this.logger.log(`Streamed and processed ${totalProcessed} albums`);
  }

  /**
   * Memory-efficient streaming sync for user tracks
   * Processes tracks in small batches without loading everything into memory
   */
  private async syncTracksStreaming(
    userId: string,
    accessToken: string,
    result: SyncResult,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    const batchSize = 50;
    let batch: Array<{ added_at: string; track: SpotifyTrackData }> = [];
    let totalProcessed = 0;
    let estimatedTotal = 0;
    const startTime = Date.now();

    // Get estimated total for progress calculation
    try {
      const firstPage = await this.spotifyService.getUserLibraryTracks(
        accessToken,
        1,
        0,
      );
      estimatedTotal = firstPage.total;
    } catch {
      this.logger.warn(
        'Could not get total track count for progress estimation',
      );
    }

    // Stream tracks and process in batches
    for await (const track of this.spotifyService.streamUserLibraryTracks(
      accessToken,
    )) {
      batch.push(track);
      totalProcessed++;

      // Process batch when it reaches the desired size
      if (batch.length >= batchSize) {
        await this.processBatchOptimized(
          userId,
          batch,
          result,
          accessToken,
          SourceType.LIKED_SONGS,
        );
        batch = []; // Clear batch to free memory

        // Report progress
        if (onProgress && estimatedTotal > 0) {
          const elapsed = Date.now() - startTime;
          const itemsPerSecond = totalProcessed / (elapsed / 1000);
          const remaining = estimatedTotal - totalProcessed;
          const estimatedTimeRemaining = remaining / itemsPerSecond;

          await onProgress({
            current: totalProcessed,
            errors: result.errors,
            estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
            itemsPerSecond: Math.round(itemsPerSecond),
            message: `Processing tracks: ${totalProcessed}/${estimatedTotal}`,
            percentage: Math.round((totalProcessed / estimatedTotal) * 33), // 0-33% for tracks phase
            phase: 'tracks',
            total: estimatedTotal,
          });
        }

        // Force garbage collection if available (for development)
        if (typeof global.gc === 'function') {
          try {
            global.gc();
          } catch (error) {
            this.logger.debug('Manual garbage collection failed:', error);
          }
        }
      }
    }

    // Process remaining tracks in the last batch
    if (batch.length > 0) {
      await this.processBatchOptimized(
        userId,
        batch,
        result,
        accessToken,
        SourceType.LIKED_SONGS,
      );
    }

    result.totalTracks = totalProcessed;
    this.logger.log(`Streamed and processed ${totalProcessed} tracks`);
  }

  /**
   * Create or update a track source entry
   * Note: Prisma doesn't support null in unique constraint where clauses,
   * so we use findFirst + create/update for null sourceId cases
   */
  private async upsertTrackSource(
    userTrackId: string,
    sourceType: SourceType,
    sourceName?: string,
    sourceId?: string,
  ): Promise<void> {
    try {
      const sourceIdValue = sourceId ?? null;
      const sourceNameValue = sourceName ?? null;

      if (sourceIdValue === null) {
        // Prisma doesn't allow null in unique constraint where clauses
        // Use findFirst + create/update instead
        const existing = await this.databaseService.trackSource.findFirst({
          where: {
            sourceId: null,
            sourceType,
            userTrackId,
          },
        });

        if (existing) {
          await this.databaseService.trackSource.update({
            data: {
              sourceName: sourceNameValue,
            },
            where: {
              id: existing.id,
            },
          });
        } else {
          await this.databaseService.trackSource.create({
            data: {
              sourceId: null,
              sourceName: sourceNameValue,
              sourceType,
              userTrackId,
            },
          });
        }
      } else {
        // sourceId is not null, can use upsert normally
        await this.databaseService.trackSource.upsert({
          create: {
            sourceId: sourceIdValue,
            sourceName: sourceNameValue,
            sourceType,
            userTrackId,
          },
          update: {
            sourceName: sourceNameValue,
          },
          where: {
            userTrackId_sourceType_sourceId: {
              sourceId: sourceIdValue,
              sourceType,
              userTrackId,
            },
          },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to upsert track source for userTrack ${userTrackId}`,
        error,
      );
    }
  }
}
