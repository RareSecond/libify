import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

/**
 * Audio features returned by ReccoBeats API
 */
export interface AudioFeatures {
  acousticness: number; // 0.0-1.0
  danceability: number; // 0.0-1.0
  energy: number; // 0.0-1.0
  instrumentalness: number; // 0.0-1.0
  key: number; // 0-11 (pitch class)
  liveness: number; // 0.0-1.0
  loudness: number; // dB, typically -60 to 0
  mode: number; // 0 = minor, 1 = major
  speechiness: number; // 0.0-1.0
  tempo: number; // BPM
  valence: number; // 0.0-1.0
}

/**
 * ReccoBeats API response item structure
 */
interface ReccoBeatsAudioFeature {
  acousticness: number;
  danceability: number;
  energy: number;
  href: string; // Spotify URL: https://open.spotify.com/track/<spotifyId>
  id: string; // ReccoBeats internal UUID (not Spotify ID)
  instrumentalness: number;
  isrc: string;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  valence: number;
}

/**
 * Service for fetching audio features from ReccoBeats API.
 * ReccoBeats provides audio analysis data similar to what Spotify's
 * deprecated Audio Features API used to provide.
 *
 * API Documentation: https://reccobeats.com/docs/apis/get-audio-features
 */
@Injectable()
export class ReccoBeatsService {
  private readonly api: AxiosInstance;
  private readonly logger = new Logger(ReccoBeatsService.name);

  constructor() {
    this.api = axios.create({
      baseURL: "https://api.reccobeats.com",
      timeout: 30000,
    });
  }

  /**
   * Fetches audio features for multiple tracks.
   * Returns a map of Spotify track ID -> AudioFeatures (or null if not found).
   *
   * @param spotifyTrackIds - Array of Spotify track IDs
   * @returns Map of track ID to audio features (null for tracks not found)
   */
  async getAudioFeatures(
    spotifyTrackIds: string[],
  ): Promise<Map<string, AudioFeatures | null>> {
    const result = new Map<string, AudioFeatures | null>();

    if (spotifyTrackIds.length === 0) {
      return result;
    }

    // Initialize all track IDs with null (in case some aren't returned)
    spotifyTrackIds.forEach((id) => result.set(id, null));

    // Process in chunks (ReccoBeats allows max 40 tracks per request)
    const chunks: string[][] = [];
    for (let i = 0; i < spotifyTrackIds.length; i += 40) {
      chunks.push(spotifyTrackIds.slice(i, i + 40));
    }

    for (const chunk of chunks) {
      try {
        const response = await this.api.get("/v1/audio-features", {
          params: { ids: chunk.join(",") },
        });

        // ReccoBeats returns { content: [...] }
        const features = response.data.content as ReccoBeatsAudioFeature[];

        // Map features to Spotify track IDs by extracting ID from href
        for (const feature of features) {
          if (!feature?.href) continue;

          // Extract Spotify track ID from href: https://open.spotify.com/track/<id>
          const spotifyIdMatch = feature.href.match(
            /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
          );
          if (!spotifyIdMatch) continue;

          const spotifyId = spotifyIdMatch[1];
          result.set(spotifyId, {
            acousticness: feature.acousticness,
            danceability: feature.danceability,
            energy: feature.energy,
            instrumentalness: feature.instrumentalness,
            key: feature.key,
            liveness: feature.liveness,
            loudness: feature.loudness,
            mode: feature.mode,
            speechiness: feature.speechiness,
            tempo: feature.tempo,
            valence: feature.valence,
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch audio features for ${chunk.length} tracks`,
          error,
        );
        // Keep null for all tracks in this chunk on error (already initialized)
      }

      // Small delay to avoid rate limiting
      if (chunks.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return result;
  }
}
