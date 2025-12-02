import { Injectable, Logger } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { AuthService } from "../auth/auth.service";
import { SpotifyService } from "../library/spotify.service";
import { CurrentPlaybackStateDto } from "./dto/current-playback.dto";
import {
  PlaybackControlResponseDto,
  PlaybackResponseDto,
} from "./dto/playback-response.dto";
import { PlayContext, QueueService } from "./queue.service";

@Injectable()
export class PlaybackService {
  private readonly logger = new Logger(PlaybackService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly spotifyService: SpotifyService,
    private readonly authService: AuthService,
  ) {}

  async getCurrentPlayback(
    userId: string,
  ): Promise<CurrentPlaybackStateDto | null> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Spotify access token not found");
      }

      const playbackState =
        await this.spotifyService.getCurrentPlaybackState(accessToken);

      if (!playbackState) {
        return null;
      }

      // Transform Spotify API response to our DTO format
      const transformed = {
        device: playbackState.device
          ? {
              id: playbackState.device.id,
              isActive: playbackState.device.is_active,
              name: playbackState.device.name,
              type: playbackState.device.type,
              volumePercent: playbackState.device.volume_percent,
            }
          : null,
        isPlaying: playbackState.is_playing,
        progressMs: playbackState.progress_ms,
        repeatState: playbackState.repeat_state,
        shuffleState: playbackState.shuffle_state,
        track: playbackState.item
          ? {
              album: {
                id: playbackState.item.album.id,
                images: playbackState.item.album.images.map((img) => img.url),
                name: playbackState.item.album.name,
              },
              artists: playbackState.item.artists.map((artist) => ({
                id: artist.id,
                name: artist.name,
              })),
              durationMs: playbackState.item.duration_ms,
              id: playbackState.item.id,
              name: playbackState.item.name,
            }
          : null,
      };

      return plainToInstance(CurrentPlaybackStateDto, transformed, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error("Failed to get current playback", error);
      throw error;
    }
  }

  async next(userId: string): Promise<PlaybackControlResponseDto> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Spotify access token not found");
      }

      await this.spotifyService.nextTrack(accessToken);
      return plainToInstance(
        PlaybackControlResponseDto,
        { message: "Skipped to next track" },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error("Failed to skip to next track", error);
      throw error;
    }
  }

  async pause(userId: string): Promise<PlaybackControlResponseDto> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Spotify access token not found");
      }

      await this.spotifyService.pausePlayback(accessToken);
      return plainToInstance(
        PlaybackControlResponseDto,
        { message: "Playback paused" },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error("Failed to pause playback", error);
      throw error;
    }
  }

  async play(
    userId: string,
    context: PlayContext,
  ): Promise<PlaybackResponseDto> {
    const totalStart = Date.now();
    this.logger.log(`Starting playback for user ${userId}`, { context });

    try {
      // Get Spotify access token
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Spotify access token not found");
      }

      // Calculate minimum tracks needed to include clicked position + buffer for next tracks
      // If user clicked track 285, we need at least 286 tracks, plus some buffer for "next" functionality
      const clickedPosition =
        context.pageNumber !== undefined &&
        context.pageSize !== undefined &&
        context.clickedIndex !== undefined
          ? (context.pageNumber - 1) * context.pageSize + context.clickedIndex
          : 0;
      // Ensure we fetch at least clickedPosition + 100 (buffer for next tracks), minimum 200
      const limit = Math.max(200, clickedPosition + 100);

      const queueStart = Date.now();
      const { offset, trackUris } = await this.queueService.buildQueue(
        userId,
        context,
        limit,
      );
      const queueDuration = Date.now() - queueStart;

      if (trackUris.length === 0) {
        throw new Error("No tracks found for the given context");
      }

      // Send all tracks to Spotify in one call, with offset to start at clicked track
      const spotifyStart = Date.now();
      await this.spotifyService.playTracks(
        accessToken,
        trackUris,
        context.deviceId,
        offset,
      );
      const spotifyDuration = Date.now() - spotifyStart;

      const totalDuration = Date.now() - totalStart;

      this.logger.log(
        `Started playback for user ${userId}: ${trackUris.length} tracks (queue: ${queueDuration}ms, spotify: ${spotifyDuration}ms, total: ${totalDuration}ms)`,
      );

      return plainToInstance(
        PlaybackResponseDto,
        {
          message: "Playback started",
          queueLength: trackUris.length,
          timings: {
            queueGeneration: queueDuration,
            spotifyCall: spotifyDuration,
            total: totalDuration,
          },
          trackUris,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error("Failed to start playback", error);
      throw error;
    }
  }

  async previous(userId: string): Promise<PlaybackControlResponseDto> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Spotify access token not found");
      }

      await this.spotifyService.previousTrack(accessToken);
      return plainToInstance(
        PlaybackControlResponseDto,
        { message: "Skipped to previous track" },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error("Failed to skip to previous track", error);
      throw error;
    }
  }

  async resume(userId: string): Promise<PlaybackControlResponseDto> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Spotify access token not found");
      }

      await this.spotifyService.resumePlayback(accessToken);
      return plainToInstance(
        PlaybackControlResponseDto,
        { message: "Playback resumed" },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error("Failed to resume playback", error);
      throw error;
    }
  }

  async transferPlayback(
    userId: string,
    deviceId: string,
  ): Promise<PlaybackControlResponseDto> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error("Spotify access token not found");
      }

      await this.spotifyService.transferPlayback(accessToken, deviceId, true);
      return plainToInstance(
        PlaybackControlResponseDto,
        { message: "Playback transferred successfully" },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error("Failed to transfer playback", error);
      throw error;
    }
  }
}
