import { Injectable, Logger } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { SpotifyService, SpotifyTrackData } from './spotify.service';

export interface SyncResult {
  errors: string[];
  newTracks: number;
  totalTracks: number;
  updatedTracks: number;
}

@Injectable()
export class LibrarySyncService {
  private readonly logger = new Logger(LibrarySyncService.name);

  constructor(
    private databaseService: DatabaseService,
    private spotifyService: SpotifyService,
  ) {}

  async getSyncStatus(userId: string): Promise<{
    lastSync: Date | null;
    totalTracks: number;
  }> {
    const totalTracks = await this.databaseService.userTrack.count({
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
    };
  }

  async syncRecentlyPlayed(userId: string, accessToken: string): Promise<void> {
    try {
      const recentTracks = await this.spotifyService.getRecentlyPlayed(accessToken);

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
      this.logger.error(`Failed to sync recently played tracks for user ${userId}`, error);
      throw error;
    }
  }

  async syncUserLibrary(userId: string, accessToken: string): Promise<SyncResult> {
    const result: SyncResult = {
      errors: [],
      newTracks: 0,
      totalTracks: 0,
      updatedTracks: 0,
    };

    try {
      this.logger.log(`Starting library sync for user ${userId}`);

      // Fetch all tracks from Spotify
      const spotifyTracks = await this.spotifyService.getAllUserLibraryTracks(accessToken);
      result.totalTracks = spotifyTracks.length;

      // Process tracks in batches to avoid overwhelming the database
      const batchSize = 100;
      for (let i = 0; i < spotifyTracks.length; i += batchSize) {
        const batch = spotifyTracks.slice(i, i + batchSize);
        await this.processBatch(userId, batch, result);
      }

      this.logger.log(`Library sync completed for user ${userId}. Result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to sync library for user ${userId}`, error);
      result.errors.push(`Library sync failed: ${  error.message}`);
      return result;
    }
  }

  private async processBatch(
    userId: string,
    tracks: Array<{ added_at: string; track: SpotifyTrackData; }>,
    result: SyncResult,
  ): Promise<void> {
    for (const { added_at, track } of tracks) {
      try {
        // First, ensure the SpotifyTrack exists (upsert)
        const spotifyTrack = await this.databaseService.spotifyTrack.upsert({
          create: {
            album: track.album?.name || '',
            albumArt: track.album?.images?.[0]?.url || null,
            artist: track.artists.map((a) => a.name).join(', '),
            duration: track.duration_ms,
            spotifyId: track.id,
            title: track.name,
          },
          update: {
            album: track.album?.name || '',
            albumArt: track.album?.images?.[0]?.url || null,
            artist: track.artists.map((a) => a.name).join(', '),
            duration: track.duration_ms,
            lastUpdated: new Date(),
            title: track.name,
          },
          where: { spotifyId: track.id },
        });

        // Then, create or update the UserTrack
        const existingUserTrack = await this.databaseService.userTrack.findUnique({
          where: {
            userId_spotifyTrackId: {
              spotifyTrackId: spotifyTrack.id,
              userId,
            },
          },
        });

        if (!existingUserTrack) {
          await this.databaseService.userTrack.create({
            data: {
              addedAt: new Date(added_at),
              spotifyTrackId: spotifyTrack.id,
              userId,
            },
          });
          result.newTracks++;
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