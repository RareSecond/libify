import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import {
  SpotifyAlbumsPaginatedResponse,
  SpotifySavedAlbum,
} from './dto/spotify-album.dto';

export interface SpotifyPaginatedResponse<T> {
  items: T[];
  limit: number;
  next: null | string;
  offset: number;
  total: number;
}

export interface SpotifyTrackData {
  added_at?: string;
  album: {
    id: string;
    images: Array<{ url: string }>;
    name: string;
  };
  artists: Array<{ id: string; name: string }>;
  duration_ms: number;
  id: string;
  name: string;
}

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly spotifyApi: AxiosInstance;

  constructor() {
    this.spotifyApi = axios.create({
      baseURL: 'https://api.spotify.com/v1',
    });
  }

  async getAllUserLibraryTracks(
    accessToken: string,
  ): Promise<Array<{ added_at: string; track: SpotifyTrackData }>> {
    const allTracks: Array<{ added_at: string; track: SpotifyTrackData }> = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getUserLibraryTracks(
        accessToken,
        limit,
        offset,
      );
      allTracks.push(...response.items);

      if (response.next === null) {
        hasMore = false;
      } else {
        offset += limit;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(`Fetched ${allTracks.length} tracks from Spotify library`);
    return allTracks;
  }

  async getAllUserSavedAlbums(
    accessToken: string,
  ): Promise<SpotifySavedAlbum[]> {
    const allAlbums: SpotifySavedAlbum[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getUserSavedAlbums(
        accessToken,
        limit,
        offset,
      );
      allAlbums.push(...response.items);

      if (response.next === null) {
        hasMore = false;
      } else {
        offset += limit;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(`Fetched ${allAlbums.length} albums from Spotify library`);
    return allAlbums;
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

  async getAvailableDevices(accessToken: string): Promise<
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
      const response = await this.spotifyApi.get('/me/player/devices', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.devices || [];
    } catch (error) {
      this.logger.error('Failed to fetch available devices', error);
      return [];
    }
  }

  async getCurrentlyPlaying(
    accessToken: string,
  ): Promise<null | { progress_ms: number; track: SpotifyTrackData }> {
    try {
      const response = await this.spotifyApi.get(
        '/me/player/currently-playing',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (response.data && response.data.item && response.data.is_playing) {
        return {
          progress_ms: response.data.progress_ms,
          track: response.data.item,
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to fetch currently playing track', error);
      return null;
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
          const response = await this.spotifyApi.get('/artists', {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { ids: chunk.join(',') },
          });
          return response.data.artists || [];
        }),
      );

      return allArtists.flat();
    } catch (error) {
      this.logger.error('Failed to get multiple artists', error);
      return [];
    }
  }

  async getRecentlyPlayed(
    accessToken: string,
    limit = 50,
  ): Promise<Array<{ played_at: string; track: SpotifyTrackData }>> {
    try {
      const response = await this.spotifyApi.get('/me/player/recently-played', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit },
      });
      return response.data.items;
    } catch (error) {
      this.logger.error('Failed to fetch recently played tracks', error);
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
        const response = await this.spotifyApi.get('/tracks', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { ids: chunk.join(',') },
        });
        allTracks.push(...response.data.tracks);
      } catch (error) {
        this.logger.error(
          `Failed to fetch tracks for IDs: ${chunk.join(',')}`,
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
      const response = await this.spotifyApi.get('/me/tracks', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch user library tracks', error);
      throw error;
    }
  }

  async getUserSavedAlbums(
    accessToken: string,
    limit = 50,
    offset = 0,
  ): Promise<SpotifyAlbumsPaginatedResponse> {
    try {
      const response = await this.spotifyApi.get('/me/albums', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch user saved albums', error);
      throw error;
    }
  }

  async playTrack(
    accessToken: string,
    trackUri: string,
    deviceId?: string,
  ): Promise<void> {
    try {
      // If no device ID provided, get the first available device
      let targetDeviceId = deviceId;
      if (!targetDeviceId) {
        const devices = await this.getAvailableDevices(accessToken);
        if (devices.length === 0) {
          throw new Error(
            'No Spotify devices available. Please open Spotify on one of your devices.',
          );
        }
        // Prefer active device, otherwise use the first available
        const activeDevice = devices.find((d) => d.is_active);
        targetDeviceId = activeDevice?.id || devices[0].id;
      }

      await this.spotifyApi.put(
        '/me/player/play',
        {
          device_id: targetDeviceId,
          uris: [trackUri],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { device_id: targetDeviceId },
        },
      );

      this.logger.log(
        `Started playing track ${trackUri} on device ${targetDeviceId}`,
      );
    } catch (error) {
      this.logger.error('Failed to play track', error);
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
      const response = await this.spotifyApi.get('/search', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          limit: 1,
          q: artistName,
          type: 'artist',
        },
      });

      const artists = response.data.artists?.items;
      return artists && artists.length > 0 ? artists[0] : null;
    } catch (error) {
      this.logger.error(`Failed to search for artist: ${artistName}`, error);
      return null;
    }
  }
}
