import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { AuthService } from "../../auth/auth.service";
import { hashTrackIds } from "../../common/utils/playlist-hash.util";
import { DatabaseService } from "../../database/database.service";
import { PlaylistSyncService } from "../../library/playlist-sync.service";
import { SpotifyService } from "../../library/spotify.service";
import { PlaylistCriteriaDto } from "../../playlists/dto/playlist-criteria.dto";
import { PlaylistsService } from "../../playlists/playlists.service";

export interface PlaylistSyncJobData {
  userId?: string;
}

interface SyncResult {
  enqueuedCount?: number;
  skippedCount?: number;
  syncedCount?: number;
}

const SPOTIFY_PLAYLIST_PREFIX = "[Codex.fm]";

@Processor("playlist-sync", {
  // Share the Redis connection with the Queue instead of creating a duplicate
  sharedConnection: true,
})
export class PlaylistSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(PlaylistSyncProcessor.name);

  constructor(
    private databaseService: DatabaseService,
    private spotifyService: SpotifyService,
    private authService: AuthService,
    private playlistsService: PlaylistsService,
    private playlistSyncService: PlaylistSyncService,
  ) {
    super();
  }

  async process(job: Job<PlaylistSyncJobData>): Promise<SyncResult> {
    // Handle scheduler job that enqueues all user syncs
    if (job.name === "sync-all-users") {
      this.logger.log(
        `Starting daily scheduler job to sync all user playlists`,
      );
      try {
        const enqueuedCount =
          await this.playlistSyncService.enqueueAllUserSyncs();
        this.logger.log(
          `Scheduler job completed: ${enqueuedCount} jobs enqueued`,
        );
        return { enqueuedCount };
      } catch (error) {
        this.logger.error(
          `Scheduler job failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    }

    // Handle individual user sync job
    const { userId } = job.data;
    if (!userId) {
      throw new Error("userId is required for sync-user-playlists job");
    }

    this.logger.log(
      `🔄 PLAYLIST SYNC PROCESSOR STARTED for user ${userId} (Job: ${job.id})`,
    );

    try {
      // Get valid access token (auto-refreshes if expired)
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Failed to get Spotify access token");
      }

      // Get user's synced playlists with autoSync enabled
      const syncedPlaylists = await this.databaseService.smartPlaylist.findMany(
        { where: { autoSync: true, spotifyPlaylistId: { not: null }, userId } },
      );

      this.logger.log(
        `Found ${syncedPlaylists.length} synced playlists for user ${userId}`,
      );

      let syncedCount = 0;
      let skippedCount = 0;

      for (const playlist of syncedPlaylists) {
        try {
          const criteria = playlist.criteria as unknown as PlaylistCriteriaDto;

          // Get current matching tracks
          const currentTrackIds =
            await this.playlistsService.getTrackIdsForSync(userId, criteria);

          // Calculate hash of current track IDs
          const currentHash = hashTrackIds(currentTrackIds);

          // Check if tracks have changed since last sync
          if (currentHash === playlist.trackIdsHash) {
            this.logger.debug(
              `Playlist "${playlist.name}" unchanged, skipping sync`,
            );
            skippedCount++;
            continue;
          }

          this.logger.log(
            `Playlist "${playlist.name}" changed, syncing to Spotify...`,
          );

          // Sync to Spotify
          await this.syncPlaylistToSpotify(
            accessToken,
            playlist,
            currentTrackIds,
            currentHash,
          );

          syncedCount++;

          // Add a small delay between syncs to respect rate limits
          await this.delay(100);
        } catch (error) {
          this.logger.error(
            `Failed to sync playlist "${playlist.name}": ${error.message}`,
            error.stack,
          );
          // Continue with other playlists
        }
      }

      this.logger.log(
        `Playlist sync completed for user ${userId}: ${syncedCount} synced, ${skippedCount} unchanged`,
      );

      return { skippedCount, syncedCount };
    } catch (error) {
      this.logger.error(
        `Playlist sync failed for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sync a playlist to Spotify with the given tracks
   */
  private async syncPlaylistToSpotify(
    accessToken: string,
    playlist: {
      criteria: unknown;
      description: null | string;
      id: string;
      name: string;
      spotifyPlaylistId: null | string;
    },
    trackIds: string[],
    newHash: string,
  ): Promise<void> {
    const { spotifyPlaylistId } = playlist;
    if (!spotifyPlaylistId) {
      this.logger.error(
        `Playlist "${playlist.name}" (${playlist.id}) has no spotifyPlaylistId, skipping sync`,
      );
      return;
    }

    const trackUris = trackIds.map((id) => `spotify:track:${id}`);
    const spotifyPlaylistName = `${SPOTIFY_PLAYLIST_PREFIX} ${playlist.name}`;
    const description =
      playlist.description || `Smart playlist synced from Codex.fm`;

    // Update playlist details
    await this.spotifyService.updatePlaylistDetails(
      accessToken,
      spotifyPlaylistId,
      spotifyPlaylistName,
      description,
    );

    // Replace tracks
    await this.spotifyService.replacePlaylistTracks(
      accessToken,
      spotifyPlaylistId,
      trackUris,
    );

    // Update lastSyncedAt and trackIdsHash
    await this.databaseService.smartPlaylist.update({
      data: { lastSyncedAt: new Date(), trackIdsHash: newHash },
      where: { id: playlist.id },
    });
  }
}
