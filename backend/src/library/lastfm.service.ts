import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

export interface LastFmTag {
  count: number;
  name: string;
}

interface LastFmArtistTopTagsResponse {
  error?: number;
  message?: string;
  toptags?: { tag?: Array<{ count: number; name: string }> };
}

interface LastFmTrackTopTagsResponse {
  error?: number;
  message?: string;
  toptags?: { tag?: Array<{ count: number; name: string }> };
}

@Injectable()
export class LastFmService {
  private readonly api: AxiosInstance;
  private readonly apiKey: string;
  private readonly backoffMultiplier = 2;

  private readonly initialBackoffMs = 1000;
  private readonly logger = new Logger(LastFmService.name);
  private readonly maxBackoffMs = 60000;
  // Retry configuration for 429 handling
  private readonly maxRetries = 5;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>("LASTFM_API_KEY") || "";
    this.api = axios.create({
      baseURL: "https://ws.audioscrobbler.com/2.0/",
      timeout: 30000,
    });
  }

  /**
   * Get top tags for an artist from Last.fm (fallback when track tags unavailable)
   * @returns Array of tags with name and count, empty array if not found
   */
  async getArtistTopTags(artist: string): Promise<LastFmTag[]> {
    if (!this.isConfigured()) {
      this.logger.warn("Last.fm API key not configured");
      return [];
    }

    try {
      const response = await this.executeWithRetry(
        () =>
          this.api.get<LastFmArtistTopTagsResponse>("", {
            params: {
              api_key: this.apiKey,
              artist,
              autocorrect: 1,
              format: "json",
              method: "artist.getTopTags",
            },
          }),
        `artist "${artist}"`,
      );

      // Handle Last.fm error responses
      if (response.data.error) {
        // Error 6 = Artist not found
        if (response.data.error !== 6) {
          this.logger.debug(
            `Last.fm API error for artist "${artist}": ${response.data.message}`,
          );
        }
        return [];
      }

      const tags = response.data.toptags?.tag || [];
      return tags.map((tag) => ({
        // Coerce to number - Last.fm API sometimes returns count as string
        count: Number(tag.count) || 0,
        name: tag.name.toLowerCase(),
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return [];
        }
        // Don't log 429 errors here - they're handled by executeWithRetry
        if (error.response?.status !== 429) {
          this.logger.debug(
            `Last.fm request failed for artist "${artist}": ${error.message}`,
          );
        }
      }
      return [];
    }
  }

  /**
   * Get top tags for a track from Last.fm
   * @returns Array of tags with name and count, empty array if not found
   */
  async getTrackTopTags(artist: string, track: string): Promise<LastFmTag[]> {
    if (!this.isConfigured()) {
      this.logger.warn("Last.fm API key not configured");
      return [];
    }

    try {
      const response = await this.executeWithRetry(
        () =>
          this.api.get<LastFmTrackTopTagsResponse>("", {
            params: {
              api_key: this.apiKey,
              artist,
              autocorrect: 1,
              format: "json",
              method: "track.getTopTags",
              track,
            },
          }),
        `track "${track}" by "${artist}"`,
      );

      // Handle Last.fm error responses
      if (response.data.error) {
        // Error 6 = Track not found, which is expected for some tracks
        if (response.data.error !== 6) {
          this.logger.debug(
            `Last.fm API error for track "${track}" by "${artist}": ${response.data.message}`,
          );
        }
        return [];
      }

      const tags = response.data.toptags?.tag || [];
      return tags.map((tag) => ({
        // Coerce to number - Last.fm API sometimes returns count as string
        count: Number(tag.count) || 0,
        name: tag.name.toLowerCase(),
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // 404 or similar - track not found
        if (error.response?.status === 404) {
          return [];
        }
        // Don't log 429 errors here - they're handled by executeWithRetry
        if (error.response?.status !== 429) {
          this.logger.debug(
            `Last.fm request failed for track "${track}" by "${artist}": ${error.message}`,
          );
        }
      }
      return [];
    }
  }

  /**
   * Check if the Last.fm API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== "your_lastfm_api_key_here";
  }

  /**
   * Execute a request with retry logic for 429 rate limit responses.
   * Uses Retry-After header when available, falls back to exponential backoff.
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: Error | null = null;
    let backoffMs = this.initialBackoffMs;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 429) {
          throw error;
        }

        lastError = error;

        if (attempt === this.maxRetries) {
          this.logger.warn(
            `Rate limit: ${context} - exhausted all ${this.maxRetries} retries`,
          );
          throw error;
        }

        // Parse Retry-After header
        const retryAfter = error.response.headers["retry-after"];
        let waitMs = backoffMs;

        if (retryAfter) {
          const retryAfterSeconds = parseInt(retryAfter, 10);
          if (!isNaN(retryAfterSeconds)) {
            // Header is in seconds
            waitMs = retryAfterSeconds * 1000;
          } else {
            // Try parsing as HTTP date
            const retryDate = new Date(retryAfter).getTime();
            if (!isNaN(retryDate)) {
              waitMs = Math.max(0, retryDate - Date.now());
            }
          }
        }

        // Cap wait time at max backoff
        waitMs = Math.min(waitMs, this.maxBackoffMs);

        this.logger.debug(
          `Rate limit: ${context} - attempt ${attempt}/${this.maxRetries}, waiting ${waitMs}ms`,
        );

        await this.sleep(waitMs);

        // Increase backoff for next attempt (exponential)
        backoffMs = Math.min(
          backoffMs * this.backoffMultiplier,
          this.maxBackoffMs,
        );
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError || new Error("Unexpected retry failure");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
