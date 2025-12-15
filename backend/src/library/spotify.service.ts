import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

import {
  SpotifyAlbumsPaginatedResponse,
  SpotifySavedAlbum,
} from "./dto/spotify-album.dto";

export interface SpotifyPaginatedResponse<T> {
  items: T[];
  limit: number;
  next: null | string;
  offset: number;
  total: number;
}

export interface SpotifyPlaylist {
  description: string;
  id: string;
  images?: { height: null | number; url: string; width: null | number }[];
  name: string;
  owner: { display_name?: string; id: string };
  snapshot_id: string;
  tracks: { href: string; total: number };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrackData;
}

export interface SpotifyTrackData {
  added_at?: string;
  album: { id: string; images: Array<{ url: string }>; name: string };
  artists: Array<{ id: string; name: string }>;
  duration_ms: number;
  external_ids?: { isrc?: string };
  id: string;
  linked_from?: { id: string; uri: string };
  name: string;
}

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly spotifyApi: AxiosInstance;

  constructor() {
    this.spotifyApi = axios.create({
      baseURL: "https://api.spotify.com/v1",
      timeout: 10000, // 10 seconds
    });
  }

  /**
   * Extracts the original Spotify track ID, handling track relinking.
   * When Spotify relinks a track (due to licensing/re-releases), the API returns
   * a new ID with linked_from pointing to the original. We always use the original
   * ID to maintain consistency with tracks already in the user's library.
   */
  static getOriginalTrackId(track: SpotifyTrackData): string {
    return track.linked_from?.id || track.id;
  }

  /**
   * Adds tracks to a playlist. Handles batching for large track lists.
   * Spotify API allows max 100 tracks per request.
   */
  async addTracksToPlaylist(
    accessToken: string,
    playlistId: string,
    trackUris: string[],
  ): Promise<void> {
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      try {
        await this.spotifyApi.post(
          `/playlists/${playlistId}/tracks`,
          { uris: batch },
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        // Add a small delay to avoid rate limiting
        if (i + batchSize < trackUris.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        this.logger.error(
          `Failed to add tracks to playlist ${playlistId} at batch ${i / batchSize}`,
          error,
        );
        throw error;
      }
    }

    this.logger.log(
      `Added ${trackUris.length} tracks to playlist ${playlistId}`,
    );
  }

  /**
   * Creates a new playlist on Spotify
   */
  async createPlaylist(
    accessToken: string,
    userId: string,
    name: string,
    description?: string,
    isPublic = false,
  ): Promise<{ id: string; snapshot_id: string }> {
    try {
      const response = await this.spotifyApi.post(
        `/users/${userId}/playlists`,
        { description: description || "", name, public: isPublic },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      this.logger.log(
        `Created playlist "${name}" with ID: ${response.data.id}`,
      );
      return { id: response.data.id, snapshot_id: response.data.snapshot_id };
    } catch (error) {
      this.logger.error(`Failed to create playlist "${name}"`, error);
      throw error;
    }
  }

  async getAllUserPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
    const allPlaylists: SpotifyPlaylist[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getUserPlaylists(accessToken, limit, offset);
      allPlaylists.push(...response.items);

      if (response.next === null) {
        hasMore = false;
      } else {
        offset += limit;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(`Fetched ${allPlaylists.length} playlists from Spotify`);
    return allPlaylists;
  }

  async getArtist(
    accessToken: string,
    artistId: string,
  ): Promise<null | {
    genres: string[];
    id: string;
    images: Array<{ url: string }>;
    name: string;
    popularity: number;
  }> {
    try {
      const response = await this.spotifyApi.get(`/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get artist ${artistId}`, error);
      return null;
    }
  }

  async getAvailableDevices(
    accessToken: string,
  ): Promise<
    Array<{
      id: string;
      is_active: boolean;
      is_private_session: boolean;
      is_restricted: boolean;
      name: string;
      type: string;
      volume_percent: number;
    }>
  > {
    try {
      const response = await this.spotifyApi.get("/me/player/devices", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.devices || [];
    } catch (error) {
      this.logger.error("Failed to fetch available devices", error);
      return [];
    }
  }

  async getCurrentlyPlaying(
    accessToken: string,
  ): Promise<null | { progress_ms: number; track: SpotifyTrackData }> {
    try {
      const response = await this.spotifyApi.get(
        "/me/player/currently-playing",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (response.data && response.data.item && response.data.is_playing) {
        return {
          progress_ms: response.data.progress_ms,
          track: response.data.item,
        };
      }

      return null;
    } catch (error) {
      this.logger.error("Failed to fetch currently playing track", error);
      return null;
    }
  }

  async getCurrentPlaybackState(
    accessToken: string,
  ): Promise<null | {
    device: {
      id: string;
      is_active: boolean;
      name: string;
      type: string;
      volume_percent: number;
    };
    is_playing: boolean;
    item: {
      album: { id: string; images: Array<{ url: string }>; name: string };
      artists: Array<{ id: string; name: string }>;
      duration_ms: number;
      id: string;
      name: string;
    };
    progress_ms: number;
    repeat_state: string;
    shuffle_state: boolean;
  }> {
    try {
      const response = await this.spotifyApi.get("/me/player", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Return null if no active playback (204 status)
      if (response.status === 204 || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      // If axios error with 204, return null
      if (axios.isAxiosError(error) && error.response?.status === 204) {
        return null;
      }
      this.logger.error("Failed to get current playback state", error);
      throw error;
    }
  }

  /**
   * Gets the current user's Spotify profile
   */
  async getCurrentUserProfile(
    accessToken: string,
  ): Promise<{ display_name?: string; email: string; id: string }> {
    try {
      const response = await this.spotifyApi.get("/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      this.logger.error("Failed to get current user profile", error);
      throw error;
    }
  }

  async getMultipleArtists(
    accessToken: string,
    artistIds: string[],
  ): Promise<
    Array<{
      genres: string[];
      id: string;
      images: Array<{ url: string }>;
      name: string;
      popularity: number;
    }>
  > {
    try {
      // Spotify API allows up to 50 artists per request
      const chunks: string[][] = [];
      for (let i = 0; i < artistIds.length; i += 50) {
        chunks.push(artistIds.slice(i, i + 50));
      }

      const allArtists = await Promise.all(
        chunks.map(async (chunk) => {
          const response = await this.spotifyApi.get("/artists", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { ids: chunk.join(",") },
          });
          return response.data.artists || [];
        }),
      );

      return allArtists.flat();
    } catch (error) {
      this.logger.error("Failed to get multiple artists", error);
      return [];
    }
  }

  async getPlaylistTracks(
    accessToken: string,
    playlistId: string,
  ): Promise<SpotifyPlaylistTrack[]> {
    const allTracks: SpotifyPlaylistTrack[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.spotifyApi.get(
          `/playlists/${playlistId}/tracks`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit, offset },
          },
        );

        const data =
          response.data as SpotifyPaginatedResponse<SpotifyPlaylistTrack>;

        // Filter out null tracks (they can be null if track was removed from Spotify)
        const validTracks = data.items.filter((item) => item.track !== null);
        allTracks.push(...validTracks);

        if (data.next === null) {
          hasMore = false;
        } else {
          offset += limit;
        }

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `Failed to fetch tracks for playlist ${playlistId}`,
          error,
        );
        throw error;
      }
    }

    this.logger.log(
      `Fetched ${allTracks.length} tracks from playlist ${playlistId}`,
    );
    return allTracks;
  }

  async getRecentlyPlayed(
    accessToken: string,
    limit = 50,
    after?: number,
  ): Promise<Array<{ played_at: string; track: SpotifyTrackData }>> {
    try {
      const params: { after?: number; limit: number } = { limit };
      if (after !== undefined) {
        params.after = after;
      }

      const response = await this.spotifyApi.get("/me/player/recently-played", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      return response.data.items;
    } catch (error) {
      this.logger.error("Failed to fetch recently played tracks", error);
      throw error;
    }
  }

  async getTracksByIds(
    accessToken: string,
    trackIds: string[],
  ): Promise<SpotifyTrackData[]> {
    if (trackIds.length === 0) return [];

    // Spotify API allows max 50 tracks per request
    const chunks = [];
    for (let i = 0; i < trackIds.length; i += 50) {
      chunks.push(trackIds.slice(i, i + 50));
    }

    const allTracks: SpotifyTrackData[] = [];

    for (const chunk of chunks) {
      try {
        const response = await this.spotifyApi.get("/tracks", {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { ids: chunk.join(",") },
        });
        allTracks.push(...response.data.tracks);
      } catch (error) {
        this.logger.error(
          `Failed to fetch tracks for IDs: ${chunk.join(",")}`,
          error,
        );
      }
    }

    return allTracks;
  }

  async getUserLibraryTracks(
    accessToken: string,
    limit = 50,
    offset = 0,
  ): Promise<
    SpotifyPaginatedResponse<{ added_at: string; track: SpotifyTrackData }>
  > {
    try {
      const response = await this.spotifyApi.get("/me/tracks", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      this.logger.error("Failed to fetch user library tracks", error);
      throw error;
    }
  }

  async getUserPlaylists(
    accessToken: string,
    limit = 50,
    offset = 0,
  ): Promise<SpotifyPaginatedResponse<SpotifyPlaylist>> {
    try {
      const response = await this.spotifyApi.get("/me/playlists", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      this.logger.error("Failed to fetch user playlists", error);
      throw error;
    }
  }

  async getUserSavedAlbums(
    accessToken: string,
    limit = 50,
    offset = 0,
  ): Promise<SpotifyAlbumsPaginatedResponse> {
    try {
      const response = await this.spotifyApi.get("/me/albums", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      this.logger.error("Failed to fetch user saved albums", error);
      throw error;
    }
  }

  async nextTrack(accessToken: string): Promise<void> {
    try {
      await this.spotifyApi.post(
        "/me/player/next",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      this.logger.log("Skipped to next track");
    } catch (error) {
      const axiosError = error as {
        message: string;
        response?: { data?: unknown; status?: number };
        stack?: string;
      };
      const errorDetails = {
        message: axiosError.message,
        response: axiosError.response?.data,
        stack: axiosError.stack,
        status: axiosError.response?.status,
      };
      this.logger.error(
        "Failed to skip to next track",
        JSON.stringify(errorDetails, null, 2),
      );
      throw error;
    }
  }

  async pausePlayback(accessToken: string): Promise<void> {
    try {
      await this.spotifyApi.put(
        "/me/player/pause",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      this.logger.log("Paused playback");
    } catch (error) {
      this.logger.error("Failed to pause playback", error);
      throw error;
    }
  }

  async playTrack(
    accessToken: string,
    trackUri: string,
    deviceId?: string,
  ): Promise<void> {
    try {
      const targetDeviceId = await this.resolveTargetDeviceId(
        accessToken,
        deviceId,
      );

      await this.spotifyApi.put(
        "/me/player/play",
        { uris: [trackUri] },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { device_id: targetDeviceId },
        },
      );

      this.logger.log(
        `Started playing track ${trackUri} on device ${targetDeviceId}`,
      );
    } catch (error) {
      this.logger.error("Failed to play track", error);
      throw error;
    }
  }

  async playTracks(
    accessToken: string,
    trackUris: string[],
    deviceId?: string,
    offset?: number,
  ): Promise<void> {
    const startTime = Date.now();

    // Validate input: early return if trackUris is empty
    if (!trackUris || trackUris.length === 0) {
      throw new Error("Cannot play tracks: trackUris array is empty");
    }

    try {
      const targetDeviceId = await this.resolveTargetDeviceId(
        accessToken,
        deviceId,
      );

      // Build request body with optional offset for starting at a specific track
      const body: { offset?: { position: number }; uris: string[] } = {
        uris: trackUris,
      };
      if (offset !== undefined && offset > 0) {
        body.offset = { position: offset };
      }

      await this.spotifyApi.put("/me/player/play", body, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { device_id: targetDeviceId },
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Started playing ${trackUris.length} tracks on device ${targetDeviceId} (took ${duration}ms)`,
      );
    } catch (error) {
      const axiosError = error as {
        message: string;
        response?: { data?: unknown; status?: number };
        stack?: string;
      };
      const errorDetails = {
        message: axiosError.message,
        response: axiosError.response?.data,
        stack: axiosError.stack,
        status: axiosError.response?.status,
      };
      this.logger.error(
        "Failed to play tracks",
        JSON.stringify(errorDetails, null, 2),
      );
      throw error;
    }
  }

  async previousTrack(accessToken: string): Promise<void> {
    try {
      await this.spotifyApi.post(
        "/me/player/previous",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      this.logger.log("Skipped to previous track");
    } catch (error) {
      const axiosError = error as {
        message: string;
        response?: { data?: unknown; status?: number };
        stack?: string;
      };
      const errorDetails = {
        message: axiosError.message,
        response: axiosError.response?.data,
        stack: axiosError.stack,
        status: axiosError.response?.status,
      };
      this.logger.error(
        "Failed to skip to previous track",
        JSON.stringify(errorDetails, null, 2),
      );
      throw error;
    }
  }

  /**
   * Replaces all tracks in a playlist with new tracks.
   * Spotify API allows max 100 tracks per request for replace.
   */
  async replacePlaylistTracks(
    accessToken: string,
    playlistId: string,
    trackUris: string[],
  ): Promise<{ snapshot_id: string }> {
    try {
      // First, replace with first 100 tracks (or empty if we have more than 100)
      const firstBatch = trackUris.slice(0, 100);
      const response = await this.spotifyApi.put(
        `/playlists/${playlistId}/tracks`,
        { uris: firstBatch },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      // If there are more than 100 tracks, add the rest in batches
      if (trackUris.length > 100) {
        const remaining = trackUris.slice(100);
        await this.addTracksToPlaylist(accessToken, playlistId, remaining);
      }

      this.logger.log(
        `Replaced tracks in playlist ${playlistId} with ${trackUris.length} tracks`,
      );
      return { snapshot_id: response.data.snapshot_id };
    } catch (error) {
      this.logger.error(
        `Failed to replace tracks in playlist ${playlistId}`,
        error,
      );
      throw error;
    }
  }

  async resumePlayback(accessToken: string): Promise<void> {
    try {
      await this.spotifyApi.put(
        "/me/player/play",
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      this.logger.log("Resumed playback");
    } catch (error) {
      this.logger.error("Failed to resume playback", error);
      throw error;
    }
  }

  async searchArtist(
    accessToken: string,
    artistName: string,
  ): Promise<null | {
    id: string;
    images: Array<{ url: string }>;
    name: string;
  }> {
    try {
      const response = await this.spotifyApi.get("/search", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 1, q: artistName, type: "artist" },
      });

      const artists = response.data.artists?.items;
      return artists && artists.length > 0 ? artists[0] : null;
    } catch (error) {
      this.logger.error(`Failed to search for artist: ${artistName}`, error);
      return null;
    }
  }

  async *streamUserLibraryTracks(
    accessToken: string,
  ): AsyncGenerator<
    { added_at: string; track: SpotifyTrackData },
    void,
    unknown
  > {
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    let totalFetched = 0;

    while (hasMore) {
      const response = await this.getUserLibraryTracks(
        accessToken,
        limit,
        offset,
      );

      // Yield each track immediately instead of accumulating
      for (const track of response.items) {
        yield track;
        totalFetched++;
      }

      if (response.next === null) {
        hasMore = false;
      } else {
        offset += limit;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(`Streamed ${totalFetched} tracks from Spotify library`);
  }

  async *streamUserSavedAlbums(
    accessToken: string,
  ): AsyncGenerator<SpotifySavedAlbum, void, unknown> {
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    let totalFetched = 0;

    while (hasMore) {
      const response = await this.getUserSavedAlbums(
        accessToken,
        limit,
        offset,
      );

      // Yield each album immediately instead of accumulating
      for (const album of response.items) {
        yield album;
        totalFetched++;
      }

      if (response.next === null) {
        hasMore = false;
      } else {
        offset += limit;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(`Streamed ${totalFetched} albums from Spotify library`);
  }

  async transferPlayback(
    accessToken: string,
    deviceId: string,
    play = true,
  ): Promise<void> {
    try {
      await this.spotifyApi.put(
        "/me/player",
        { device_ids: [deviceId], play },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      this.logger.log(
        `Transferred playback to device ${deviceId} (play: ${play})`,
      );
    } catch (error) {
      this.logger.error("Failed to transfer playback", error);
      throw error;
    }
  }

  /**
   * Updates playlist details (name, description)
   */
  async updatePlaylistDetails(
    accessToken: string,
    playlistId: string,
    name: string,
    description?: string,
  ): Promise<void> {
    try {
      await this.spotifyApi.put(
        `/playlists/${playlistId}`,
        { description: description || "", name },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      this.logger.log(`Updated playlist details for ${playlistId}`);
    } catch (error) {
      this.logger.error(`Failed to update playlist ${playlistId}`, error);
      throw error;
    }
  }

  /**
   * Resolves the target device ID for playback.
   * If deviceId is provided, returns it. Otherwise, fetches available devices
   * and returns the active device or first available device.
   */
  private async resolveTargetDeviceId(
    accessToken: string,
    deviceId?: string,
  ): Promise<string> {
    if (deviceId) {
      return deviceId;
    }

    const devices = await this.getAvailableDevices(accessToken);
    if (devices.length === 0) {
      throw new Error(
        "No Spotify devices available. Please open Spotify on one of your devices.",
      );
    }

    // Prefer active device, otherwise use the first available
    const activeDevice = devices.find((d) => d.is_active);
    return activeDevice?.id || devices[0].id;
  }
}
