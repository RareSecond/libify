import { Injectable, Logger } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { SpotifyService } from '../library/spotify.service';
import { PlayContext, QueueService } from './queue.service';

export interface PlaybackResponse {
  message: string;
  queueLength: number;
  timings: {
    queueGeneration: number;
    spotifyCall: number;
    total: number;
  };
  trackUris: string[];
}

@Injectable()
export class PlaybackService {
  private readonly logger = new Logger(PlaybackService.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly spotifyService: SpotifyService,
    private readonly authService: AuthService,
  ) {}

  async next(userId: string): Promise<{ message: string }> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error('Spotify access token not found');
      }

      await this.spotifyService.nextTrack(accessToken);
      return { message: 'Skipped to next track' };
    } catch (error) {
      this.logger.error('Failed to skip to next track', error);
      throw error;
    }
  }

  async pause(userId: string): Promise<{ message: string }> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error('Spotify access token not found');
      }

      await this.spotifyService.pausePlayback(accessToken);
      return { message: 'Playback paused' };
    } catch (error) {
      this.logger.error('Failed to pause playback', error);
      throw error;
    }
  }

  async play(userId: string, context: PlayContext): Promise<PlaybackResponse> {
    const totalStart = Date.now();
    this.logger.log(`Starting playback for user ${userId}`, { context });

    try {
      // Get Spotify access token
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error('Spotify access token not found');
      }

      // Build queue (200 tracks max)
      const queueStart = Date.now();
      const trackUris = await this.queueService.buildQueue(
        userId,
        context,
        200,
      );
      const queueDuration = Date.now() - queueStart;

      if (trackUris.length === 0) {
        throw new Error('No tracks found for the given context');
      }

      // Send all tracks to Spotify in one call
      const spotifyStart = Date.now();
      await this.spotifyService.playTracks(accessToken, trackUris);
      const spotifyDuration = Date.now() - spotifyStart;

      const totalDuration = Date.now() - totalStart;

      this.logger.log(
        `Started playback for user ${userId}: ${trackUris.length} tracks (queue: ${queueDuration}ms, spotify: ${spotifyDuration}ms, total: ${totalDuration}ms)`,
      );

      return {
        message: 'Playback started',
        queueLength: trackUris.length,
        timings: {
          queueGeneration: queueDuration,
          spotifyCall: spotifyDuration,
          total: totalDuration,
        },
        trackUris,
      };
    } catch (error) {
      this.logger.error('Failed to start playback', error);
      throw error;
    }
  }

  async resume(userId: string): Promise<{ message: string }> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(userId);
      if (!accessToken) {
        throw new Error('Spotify access token not found');
      }

      await this.spotifyService.resumePlayback(accessToken);
      return { message: 'Playback resumed' };
    } catch (error) {
      this.logger.error('Failed to resume playback', error);
      throw error;
    }
  }
}
