import { Injectable, Logger } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";
import { LastFmService, LastFmTag } from "./lastfm.service";

interface EnrichmentResult {
  failed: number;
  success: number;
}

@Injectable()
export class GenreEnrichmentService {
  private genreCache: Map<string, string> | null = null; // name -> id
  private readonly logger = new Logger(GenreEnrichmentService.name);
  // Minimum Last.fm tag weight (0-100 relative scale) to consider a tag relevant
  private readonly minTagWeight = 5;

  constructor(
    private readonly lastFmService: LastFmService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Enrich a single track with genres from Last.fm
   */
  async enrichTrack(trackId: string): Promise<boolean> {
    try {
      // Get track with artist name
      const track = await this.databaseService.spotifyTrack.findUnique({
        include: { artist: { select: { name: true } } },
        where: { id: trackId },
      });

      if (!track) {
        this.logger.debug(`Track not found: ${trackId}`);
        return false;
      }

      // Get tags from Last.fm - try track first, then fallback to artist
      let tags = await this.lastFmService.getTrackTopTags(
        track.artist.name,
        track.title,
      );

      if (tags.length === 0) {
        tags = await this.lastFmService.getArtistTopTags(track.artist.name);
      }

      if (tags.length === 0) {
        // No tags found, just update the timestamp
        await this.databaseService.spotifyTrack.update({
          data: { genresUpdatedAt: new Date() },
          where: { id: trackId },
        });
        return true;
      }

      // Filter and match against whitelist
      const matchedGenres = await this.matchGenresToWhitelist(tags);

      // Take top 5 by weight
      const topGenres = matchedGenres.slice(0, 5);

      // Upsert TrackGenre records in a transaction
      await this.databaseService.$transaction(async (tx) => {
        // Delete existing genres for this track
        await tx.trackGenre.deleteMany({ where: { trackId } });

        // Insert new genres
        if (topGenres.length > 0) {
          await tx.trackGenre.createMany({
            data: topGenres.map((g) => ({
              genreId: g.genreId,
              trackId,
              weight: g.weight,
            })),
          });
        }

        // Update genresUpdatedAt
        await tx.spotifyTrack.update({
          data: { genresUpdatedAt: new Date() },
          where: { id: trackId },
        });
      });

      this.logger.debug(
        `Enriched track "${track.title}" with ${topGenres.length} genres`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to enrich track ${trackId}:`, error);
      return false;
    }
  }

  /**
   * Enrich multiple tracks
   */
  async enrichTracks(trackIds: string[]): Promise<EnrichmentResult> {
    let success = 0;
    let failed = 0;

    for (const trackId of trackIds) {
      const result = await this.enrichTrack(trackId);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { failed, success };
  }

  /**
   * Get count of tracks missing genres (for admin status)
   */
  async getGenreBackfillStatus(): Promise<{
    completed: number;
    pending: number;
    total: number;
  }> {
    const [pending, total] = await Promise.all([
      this.databaseService.spotifyTrack.count({
        where: { genresUpdatedAt: null },
      }),
      this.databaseService.spotifyTrack.count(),
    ]);

    return { completed: total - pending, pending, total };
  }

  /**
   * Get track IDs that haven't been enriched yet
   */
  async getUnenrichedTrackIds(limit = 1000): Promise<string[]> {
    const tracks = await this.databaseService.spotifyTrack.findMany({
      select: { id: true },
      take: limit,
      where: { genresUpdatedAt: null },
    });
    return tracks.map((t) => t.id);
  }

  /**
   * Get unenriched tracks for a specific user
   */
  async getUnenrichedTrackIdsForUser(
    userId: string,
    limit = 1000,
  ): Promise<string[]> {
    const userTracks = await this.databaseService.userTrack.findMany({
      select: { spotifyTrack: { select: { id: true } } },
      take: limit,
      where: { spotifyTrack: { genresUpdatedAt: null }, userId },
    });

    return userTracks.map((ut) => ut.spotifyTrack.id);
  }

  /**
   * Reset all genre data — deletes all TrackGenre records and nulls genresUpdatedAt
   */
  async resetAllGenres(): Promise<{ tracksReset: number }> {
    const [, updateResult] = await this.databaseService.$transaction([
      this.databaseService.trackGenre.deleteMany(),
      this.databaseService.spotifyTrack.updateMany({
        data: { genresUpdatedAt: null },
        where: { genresUpdatedAt: { not: null } },
      }),
    ]);

    this.logger.log(`Reset genres for ${updateResult.count} tracks`);
    return { tracksReset: updateResult.count };
  }

  /**
   * Load genre whitelist into cache
   */
  private async loadGenreCache(): Promise<Map<string, string>> {
    if (this.genreCache) {
      return this.genreCache;
    }

    const genres = await this.databaseService.genre.findMany({
      select: { id: true, name: true },
    });

    this.genreCache = new Map(genres.map((g) => [g.name.toLowerCase(), g.id]));
    this.logger.log(`Loaded ${this.genreCache.size} genres into cache`);
    return this.genreCache;
  }

  /**
   * Match Last.fm tags against our genre whitelist
   * Returns matched genres with their weights, sorted by weight descending
   */
  private async matchGenresToWhitelist(
    tags: LastFmTag[],
  ): Promise<Array<{ genreId: string; name: string; weight: number }>> {
    const genreMap = await this.loadGenreCache();
    const matched: Array<{ genreId: string; name: string; weight: number }> =
      [];

    for (const tag of tags) {
      if (tag.count < this.minTagWeight) {
        continue;
      }

      const normalizedName = tag.name.toLowerCase().trim();
      const genreId = genreMap.get(normalizedName);

      if (genreId) {
        matched.push({ genreId, name: normalizedName, weight: tag.count });
      }
    }

    // Sort by weight descending
    return matched.sort((a, b) => b.weight - a.weight);
  }
}
