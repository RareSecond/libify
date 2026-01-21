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
  private lastRequestTime = 0;
  private readonly logger = new Logger(LastFmService.name);
  private readonly minRequestInterval = 200; // 200ms between requests (5 req/sec)

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

    await this.rateLimit();

    try {
      const response = await this.api.get<LastFmArtistTopTagsResponse>("", {
        params: {
          api_key: this.apiKey,
          artist,
          autocorrect: 1,
          format: "json",
          method: "artist.getTopTags",
        },
      });

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
        this.logger.debug(
          `Last.fm request failed for artist "${artist}": ${error.message}`,
        );
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

    await this.rateLimit();

    try {
      const response = await this.api.get<LastFmTrackTopTagsResponse>("", {
        params: {
          api_key: this.apiKey,
          artist,
          autocorrect: 1,
          format: "json",
          method: "track.getTopTags",
          track,
        },
      });

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
        this.logger.debug(
          `Last.fm request failed for track "${track}" by "${artist}": ${error.message}`,
        );
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
   * Ensures rate limiting by waiting if necessary
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}
