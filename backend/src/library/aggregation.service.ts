import { Injectable, Logger } from "@nestjs/common";
import { sql } from "kysely";

import { DatabaseService } from "../database/database.service";
import { KyselyService } from "../database/kysely/kysely.service";
import { SpotifyAlbumTrack, SpotifySavedAlbum } from "./dto/spotify-album.dto";
import { SpotifyService } from "./spotify.service";

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private databaseService: DatabaseService,
    private kyselyService: KyselyService,
  ) {}

  /**
   * Bulk update all album stats for a user using a single CTE query
   * Much faster than N+1 individual updates (500 albums: 35s -> <1s)
   */
  async bulkUpdateAllAlbumStats(userId: string): Promise<void> {
    const db = this.kyselyService.database;

    this.logger.log(`Bulk updating album stats for user ${userId}`);

    await sql`
      WITH album_stats AS (
        SELECT
          ut."userId",
          st."albumId",
          COUNT(*)::int as "trackCount",
          COALESCE(SUM(st.duration), 0)::int as "totalDuration",
          COALESCE(SUM(ut."totalPlayCount"), 0)::int as "totalPlayCount",
          COUNT(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::int as "ratedTrackCount",
          ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1) as "avgRating",
          MIN(ut."addedAt") as "firstAddedAt",
          MAX(ut."lastPlayedAt") as "lastPlayedAt"
        FROM "UserTrack" ut
        INNER JOIN "SpotifyTrack" st ON ut."spotifyTrackId" = st.id
        WHERE ut."userId" = ${userId}
          AND ut."addedToLibrary" = true
        GROUP BY ut."userId", st."albumId"
      )
      INSERT INTO "UserAlbum" (
        id, "userId", "albumId", "trackCount", "totalDuration", "totalPlayCount",
        "avgRating", "ratedTrackCount", "firstAddedAt", "lastPlayedAt", "updatedAt"
      )
      SELECT
        gen_random_uuid(),
        "userId",
        "albumId",
        "trackCount",
        "totalDuration",
        "totalPlayCount",
        "avgRating",
        "ratedTrackCount",
        "firstAddedAt",
        "lastPlayedAt",
        NOW()
      FROM album_stats
      ON CONFLICT ("userId", "albumId")
      DO UPDATE SET
        "trackCount" = EXCLUDED."trackCount",
        "totalDuration" = EXCLUDED."totalDuration",
        "totalPlayCount" = EXCLUDED."totalPlayCount",
        "avgRating" = EXCLUDED."avgRating",
        "ratedTrackCount" = EXCLUDED."ratedTrackCount",
        "lastPlayedAt" = EXCLUDED."lastPlayedAt",
        "updatedAt" = NOW()
    `.execute(db);

    this.logger.debug(`Completed bulk album stats update for user ${userId}`);
  }

  /**
   * Bulk update all artist stats for a user using a single CTE query
   * Much faster than N+1 individual updates (200 artists: ~15s -> <1s)
   */
  async bulkUpdateAllArtistStats(userId: string): Promise<void> {
    const db = this.kyselyService.database;

    this.logger.log(`Bulk updating artist stats for user ${userId}`);

    await sql`
      WITH artist_stats AS (
        SELECT
          ut."userId",
          st."artistId",
          COUNT(*)::int as "trackCount",
          COUNT(DISTINCT st."albumId")::int as "albumCount",
          COALESCE(SUM(st.duration), 0)::int as "totalDuration",
          COALESCE(SUM(ut."totalPlayCount"), 0)::int as "totalPlayCount",
          COUNT(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::int as "ratedTrackCount",
          ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1) as "avgRating",
          MIN(ut."addedAt") as "firstAddedAt",
          MAX(ut."lastPlayedAt") as "lastPlayedAt"
        FROM "UserTrack" ut
        INNER JOIN "SpotifyTrack" st ON ut."spotifyTrackId" = st.id
        WHERE ut."userId" = ${userId}
          AND ut."addedToLibrary" = true
        GROUP BY ut."userId", st."artistId"
      )
      INSERT INTO "UserArtist" (
        id, "userId", "artistId", "trackCount", "albumCount", "totalDuration",
        "totalPlayCount", "avgRating", "ratedTrackCount", "firstAddedAt",
        "lastPlayedAt", "updatedAt"
      )
      SELECT
        gen_random_uuid(),
        "userId",
        "artistId",
        "trackCount",
        "albumCount",
        "totalDuration",
        "totalPlayCount",
        "avgRating",
        "ratedTrackCount",
        "firstAddedAt",
        "lastPlayedAt",
        NOW()
      FROM artist_stats
      ON CONFLICT ("userId", "artistId")
      DO UPDATE SET
        "trackCount" = EXCLUDED."trackCount",
        "albumCount" = EXCLUDED."albumCount",
        "totalDuration" = EXCLUDED."totalDuration",
        "totalPlayCount" = EXCLUDED."totalPlayCount",
        "avgRating" = EXCLUDED."avgRating",
        "ratedTrackCount" = EXCLUDED."ratedTrackCount",
        "lastPlayedAt" = EXCLUDED."lastPlayedAt",
        "updatedAt" = NOW()
    `.execute(db);

    this.logger.debug(`Completed bulk artist stats update for user ${userId}`);
  }

  /**
   * Bulk update all playlist stats for a user using a single query
   * Calculates stats from tracks that have playlist as their source via TrackSource
   */
  async bulkUpdateAllPlaylistStats(userId: string): Promise<void> {
    const db = this.kyselyService.database;

    this.logger.log(`Bulk updating playlist stats for user ${userId}`);

    await sql`
      WITH playlist_stats AS (
        SELECT
          up.id as "playlistId",
          COUNT(DISTINCT ut.id)::int as "trackCount",
          COALESCE(SUM(st.duration), 0)::int as "totalDuration",
          COALESCE(SUM(ut."totalPlayCount"), 0)::int as "totalPlayCount",
          COUNT(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::int as "ratedTrackCount",
          ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1) as "avgRating",
          MIN(ts."createdAt") as "firstAddedAt",
          MAX(ut."lastPlayedAt") as "lastPlayedAt"
        FROM "UserPlaylist" up
        INNER JOIN "TrackSource" ts ON ts."sourceId" = up."spotifyId" AND ts."sourceType" = 'PLAYLIST'
        INNER JOIN "UserTrack" ut ON ut.id = ts."userTrackId"
        INNER JOIN "SpotifyTrack" st ON ut."spotifyTrackId" = st.id
        WHERE up."userId" = ${userId}
          AND ut."addedToLibrary" = true
        GROUP BY up.id
      )
      UPDATE "UserPlaylist" up
      SET
        "totalTracks" = ps."trackCount",
        "totalDuration" = ps."totalDuration",
        "totalPlayCount" = ps."totalPlayCount",
        "avgRating" = ps."avgRating",
        "ratedTrackCount" = ps."ratedTrackCount",
        "firstAddedAt" = ps."firstAddedAt",
        "lastPlayedAt" = ps."lastPlayedAt",
        "updatedAt" = NOW()
      FROM playlist_stats ps
      WHERE up.id = ps."playlistId"
    `.execute(db);

    this.logger.debug(
      `Completed bulk playlist stats update for user ${userId}`,
    );
  }

  async createOrUpdateAlbumEntities(
    savedAlbum: SpotifySavedAlbum,
    artistMap: Map<
      string,
      {
        id: string;
        images: Array<{ url: string }>;
        name: string;
        popularity: number;
      }
    >,
  ): Promise<{ albumId: string; artistId: string; trackIds: string[] }> {
    const albumData = savedAlbum.album;

    // For now, we'll use the first artist (primary artist)
    const primaryArtist = albumData.artists[0];
    if (!primaryArtist) {
      throw new Error("Album has no artists");
    }

    // Get artist data from the pre-fetched map
    let artistImageUrl: null | string = null;
    let popularity: null | number = null;
    const artistData = artistMap.get(primaryArtist.id);
    if (artistData) {
      if (artistData.images.length > 0) {
        artistImageUrl = artistData.images[0].url;
      }
      popularity = artistData.popularity;
    }

    // Since we assume Spotify metadata never changes, only create artist if it doesn't exist
    let artist = await this.databaseService.spotifyArtist.findUnique({
      where: { spotifyId: primaryArtist.id },
    });

    if (!artist) {
      artist = await this.databaseService.spotifyArtist.create({
        data: {
          imageUrl: artistImageUrl,
          name: primaryArtist.name,
          popularity,
          spotifyId: primaryArtist.id,
        },
      });
    }

    // Parse release date
    let releaseDate: Date | null = null;
    if (albumData.release_date) {
      try {
        releaseDate = new Date(albumData.release_date);
      } catch {
        this.logger.warn(
          `Failed to parse release date for album ${albumData.id}: ${albumData.release_date}`,
        );
      }
    }

    // Create or update album
    const album = await this.databaseService.spotifyAlbum.upsert({
      create: {
        albumType: albumData.album_type,
        artistId: artist.id,
        imageUrl: albumData.images.length > 0 ? albumData.images[0].url : null,
        name: albumData.name,
        releaseDate,
        spotifyId: albumData.id,
        totalTracks: albumData.total_tracks,
      },
      update: {
        albumType: albumData.album_type,
        imageUrl: albumData.images.length > 0 ? albumData.images[0].url : null,
        name: albumData.name,
        releaseDate,
        totalTracks: albumData.total_tracks,
      },
      where: { spotifyId: albumData.id },
    });

    // Process album tracks if they're included
    const trackIds: string[] = [];
    if (albumData.tracks && albumData.tracks.items.length > 0) {
      for (const trackData of albumData.tracks.items) {
        // Handle track relinking: use original track ID if available
        const spotifyTrackId = this.getOriginalAlbumTrackId(trackData);

        const track = await this.databaseService.spotifyTrack.upsert({
          create: {
            albumId: album.id,
            artistId: artist.id,
            discNumber: trackData.disc_number || 1,
            duration: trackData.duration_ms,
            explicit: trackData.explicit,
            previewUrl: trackData.preview_url,
            spotifyId: spotifyTrackId,
            title: trackData.name,
            trackNumber: trackData.track_number,
          },
          update: {
            albumId: album.id,
            artistId: artist.id,
            discNumber: trackData.disc_number || 1,
            duration: trackData.duration_ms,
            explicit: trackData.explicit,
            previewUrl: trackData.preview_url,
            title: trackData.name,
            trackNumber: trackData.track_number,
          },
          where: { spotifyId: spotifyTrackId },
        });
        trackIds.push(track.id);
      }
    }

    return { albumId: album.id, artistId: artist.id, trackIds };
  }

  async createOrUpdateSpotifyEntities(
    spotifyTrackData: {
      album: {
        id: string;
        images: Array<{ url: string }>;
        name: string;
        release_date?: string;
      };
      artists: Array<{ id: string; name: string }>;
      duration_ms: number;
      external_ids?: { isrc?: string };
      id: string;
      linked_from?: { id: string; uri: string };
      name: string;
    },
    artistMap: Map<
      string,
      {
        id: string;
        images: Array<{ url: string }>;
        name: string;
        popularity: number;
      }
    >,
  ): Promise<{ albumId: null | string; artistId: string; trackId: string }> {
    // For now, we'll use the first artist (primary artist)
    const primaryArtist = spotifyTrackData.artists[0];
    if (!primaryArtist) {
      throw new Error("Track has no artists");
    }

    // Get artist data from the pre-fetched map
    let artistImageUrl: null | string = null;
    let popularity: null | number = null;
    const artistData = artistMap.get(primaryArtist.id);
    if (artistData) {
      if (artistData.images.length > 0) {
        artistImageUrl = artistData.images[0].url;
      }
      popularity = artistData.popularity;
    } else {
      this.logger.warn(
        `No artist data found for ${primaryArtist.name} (${primaryArtist.id}) in pre-fetched map`,
      );
    }

    // Since we assume Spotify metadata never changes, only create artist if it doesn't exist
    let artist = await this.databaseService.spotifyArtist.findUnique({
      where: { spotifyId: primaryArtist.id },
    });

    if (!artist) {
      artist = await this.databaseService.spotifyArtist.create({
        data: {
          imageUrl: artistImageUrl,
          name: primaryArtist.name,
          popularity,
          spotifyId: primaryArtist.id,
        },
      });
    }

    // Since we assume Spotify metadata never changes, only create album if it doesn't exist
    let album = await this.databaseService.spotifyAlbum.findUnique({
      where: { spotifyId: spotifyTrackData.album.id },
    });

    if (!album) {
      let releaseDate: Date | null = null;
      if (spotifyTrackData.album.release_date) {
        try {
          releaseDate = new Date(spotifyTrackData.album.release_date);
        } catch {
          this.logger.warn(
            `Failed to parse release date for album ${spotifyTrackData.album.id}: ${spotifyTrackData.album.release_date}`,
          );
        }
      }

      album = await this.databaseService.spotifyAlbum.create({
        data: {
          artistId: artist.id,
          imageUrl:
            spotifyTrackData.album.images.length > 0
              ? spotifyTrackData.album.images[0].url
              : null,
          name: spotifyTrackData.album.name,
          releaseDate,
          spotifyId: spotifyTrackData.album.id,
        },
      });
    }

    // Handle track relinking: use original track ID if available
    const spotifyTrackId = SpotifyService.getOriginalTrackId(spotifyTrackData);
    const isrc = spotifyTrackData.external_ids?.isrc;

    // Primary: Check if track exists by ISRC (handles relinking)
    let track;
    if (isrc) {
      track = await this.databaseService.spotifyTrack.findUnique({
        where: { isrc },
      });
    }

    // Fallback: Check by Spotify ID (for tracks without ISRC or old data)
    if (!track) {
      track = await this.databaseService.spotifyTrack.findUnique({
        where: { spotifyId: spotifyTrackId },
      });
    }

    if (!track) {
      // Create new track with ISRC
      track = await this.databaseService.spotifyTrack.create({
        data: {
          albumId: album.id,
          artistId: artist.id,
          duration: spotifyTrackData.duration_ms,
          isrc: isrc || null,
          spotifyId: spotifyTrackId,
          title: spotifyTrackData.name,
        },
      });
      this.logger.debug(
        `Created new track: ${spotifyTrackData.name} [${spotifyTrackId}${isrc ? `, ISRC: ${isrc}` : ""}]`,
      );
    } else {
      // Track exists - update ISRC and/or Spotify ID if needed
      const needsUpdate =
        (isrc && !track.isrc) || // Add missing ISRC
        track.spotifyId !== spotifyTrackId; // Update Spotify ID

      if (needsUpdate) {
        const updates: { isrc?: string; spotifyId?: string } = {};

        if (isrc && !track.isrc) {
          updates.isrc = isrc;
          this.logger.log(
            `Adding ISRC to existing track ${track.title}: ${isrc}`,
          );
        }

        if (track.spotifyId !== spotifyTrackId) {
          updates.spotifyId = spotifyTrackId;
          this.logger.log(
            `Updating Spotify ID for track ${track.title}: ${track.spotifyId} -> ${spotifyTrackId}`,
          );
        }

        track = await this.databaseService.spotifyTrack.update({
          data: updates,
          where: { id: track.id },
        });
      }
    }

    return { albumId: album.id, artistId: artist.id, trackId: track.id };
  }

  /**
   * Get artist statistics without loading all data into memory
   * This replaces the PRODUCTION_DATA_ARCHITECTURE_GUIDE's $queryRaw example
   */
  async getArtistStats(userId: string, limit = 100) {
    const db = this.kyselyService.database;

    return db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .where("ut.userId", "=", userId)
      .groupBy(["sar.id", "sar.name", "sar.imageUrl"])
      .select([
        "sar.id",
        "sar.name",
        "sar.imageUrl",
        sql<number>`COUNT(DISTINCT ut.id)::int`.as("trackCount"),
        sql<number>`SUM(ut."totalPlayCount")::int`.as("totalPlays"),
        sql<Date>`MAX(ut."lastPlayedAt")`.as("lastPlayed"),
        sql<number>`ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1)`.as(
          "avgRating",
        ),
      ])
      .orderBy("totalPlays", "desc")
      .limit(limit)
      .execute();
  }

  /**
   * Batch update ISRC values for album tracks using full track data from Spotify
   * This is needed because /me/albums returns simplified track objects without external_ids
   */
  async populateISRCForTracks(
    spotifyTrackIds: string[],
    fullTrackData: Array<{
      external_ids?: { isrc?: string };
      id: string;
      linked_from?: { id: string; uri: string };
    }>,
  ): Promise<{ skipped: number; updated: number }> {
    let updated = 0;
    let skipped = 0;

    for (const trackData of fullTrackData) {
      const isrc = trackData.external_ids?.isrc;
      const spotifyTrackId = this.getOriginalTrackId(trackData);

      if (!isrc) {
        skipped++;
        continue;
      }

      // Find the track by Spotify ID
      const track = await this.databaseService.spotifyTrack.findUnique({
        where: { spotifyId: spotifyTrackId },
      });

      if (!track) {
        this.logger.warn(
          `Track ${spotifyTrackId} not found in database during ISRC population`,
        );
        continue;
      }

      // Update ISRC if missing
      if (!track.isrc) {
        await this.databaseService.spotifyTrack.update({
          data: { isrc },
          where: { id: track.id },
        });
        updated++;
      }
    }

    return { skipped, updated };
  }

  async updateAllUserStats(userId: string): Promise<void> {
    this.logger.log(`Updating all stats for user ${userId} using bulk method`);

    // Use bulk CTE-based updates instead of N+1 queries
    // This reduces 700+ queries to just 3 queries (10-100x faster)
    await Promise.all([
      this.bulkUpdateAllAlbumStats(userId),
      this.bulkUpdateAllArtistStats(userId),
      this.bulkUpdateAllPlaylistStats(userId),
    ]);

    this.logger.log(`Completed updating all stats for user ${userId}`);
  }

  async updateStatsForTrack(
    userId: string,
    spotifyTrackId: string,
  ): Promise<void> {
    // Get the track with its relations
    const track = await this.databaseService.spotifyTrack.findUnique({
      where: { id: spotifyTrackId },
    });

    if (!track) {
      this.logger.warn(`Track ${spotifyTrackId} not found`);
      return;
    }

    // Update artist stats
    await this.updateUserArtistStats(userId, track.artistId);

    // Update album stats
    await this.updateUserAlbumStats(userId, track.albumId);
  }

  async updateUserAlbumStats(userId: string, albumId: string): Promise<void> {
    const db = this.kyselyService.database;

    // Calculate all stats in a single query
    const stats = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .where("ut.userId", "=", userId)
      .where("st.albumId", "=", albumId)
      .where("ut.addedToLibrary", "=", true)
      .select([
        sql<number>`COUNT(*)::int`.as("trackCount"),
        sql<number>`SUM(st.duration)::int`.as("totalDuration"),
        sql<number>`SUM(ut."totalPlayCount")::int`.as("totalPlayCount"),
        sql<number>`COUNT(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::int`.as(
          "ratedTrackCount",
        ),
        sql<number>`ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1)`.as(
          "avgRating",
        ),
        sql<Date>`MIN(ut."addedAt")`.as("firstAddedAt"),
        sql<Date>`MAX(ut."lastPlayedAt")`.as("lastPlayedAt"),
      ])
      .executeTakeFirst();

    if (!stats || stats.trackCount === 0) {
      // No tracks for this album, remove the UserAlbum record if it exists
      await db
        .deleteFrom("UserAlbum")
        .where("userId", "=", userId)
        .where("albumId", "=", albumId)
        .execute();
      return;
    }

    // Upsert the aggregated stats
    await db
      .insertInto("UserAlbum")
      .values({
        albumId,
        avgRating: stats.avgRating,
        firstAddedAt: stats.firstAddedAt,
        id: sql<string>`gen_random_uuid()`,
        lastPlayedAt: stats.lastPlayedAt,
        ratedTrackCount: stats.ratedTrackCount,
        totalDuration: stats.totalDuration ?? 0,
        totalPlayCount: stats.totalPlayCount ?? 0,
        trackCount: stats.trackCount,
        updatedAt: sql`now()`,
        userId,
      })
      .onConflict((oc) =>
        oc
          .columns(["userId", "albumId"])
          .doUpdateSet({
            avgRating: stats.avgRating,
            lastPlayedAt: stats.lastPlayedAt,
            ratedTrackCount: stats.ratedTrackCount,
            totalDuration: stats.totalDuration ?? 0,
            totalPlayCount: stats.totalPlayCount ?? 0,
            trackCount: stats.trackCount,
            updatedAt: sql`now()`,
          }),
      )
      .execute();

    this.logger.debug(
      `Updated UserAlbum stats for user ${userId}, album ${albumId}`,
    );
  }

  async updateUserArtistStats(userId: string, artistId: string): Promise<void> {
    const db = this.kyselyService.database;

    // Calculate all stats in a single query
    const stats = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .where("ut.userId", "=", userId)
      .where("st.artistId", "=", artistId)
      .where("ut.addedToLibrary", "=", true)
      .select([
        sql<number>`COUNT(*)::int`.as("trackCount"),
        sql<number>`COUNT(DISTINCT st."albumId")::int`.as("albumCount"),
        sql<number>`SUM(st.duration)::int`.as("totalDuration"),
        sql<number>`SUM(ut."totalPlayCount")::int`.as("totalPlayCount"),
        sql<number>`COUNT(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::int`.as(
          "ratedTrackCount",
        ),
        sql<number>`ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1)`.as(
          "avgRating",
        ),
        sql<Date>`MIN(ut."addedAt")`.as("firstAddedAt"),
        sql<Date>`MAX(ut."lastPlayedAt")`.as("lastPlayedAt"),
      ])
      .executeTakeFirst();

    if (!stats || stats.trackCount === 0) {
      // No tracks for this artist, remove the UserArtist record if it exists
      await db
        .deleteFrom("UserArtist")
        .where("userId", "=", userId)
        .where("artistId", "=", artistId)
        .execute();
      return;
    }

    // Upsert the aggregated stats
    await db
      .insertInto("UserArtist")
      .values({
        albumCount: stats.albumCount,
        artistId,
        avgRating: stats.avgRating,
        firstAddedAt: stats.firstAddedAt,
        id: sql<string>`gen_random_uuid()`,
        lastPlayedAt: stats.lastPlayedAt,
        ratedTrackCount: stats.ratedTrackCount,
        totalDuration: stats.totalDuration ?? 0,
        totalPlayCount: stats.totalPlayCount ?? 0,
        trackCount: stats.trackCount,
        updatedAt: sql`now()`,
        userId,
      })
      .onConflict((oc) =>
        oc
          .columns(["userId", "artistId"])
          .doUpdateSet({
            albumCount: stats.albumCount,
            avgRating: stats.avgRating,
            lastPlayedAt: stats.lastPlayedAt,
            ratedTrackCount: stats.ratedTrackCount,
            totalDuration: stats.totalDuration ?? 0,
            totalPlayCount: stats.totalPlayCount ?? 0,
            trackCount: stats.trackCount,
            updatedAt: sql`now()`,
          }),
      )
      .execute();

    this.logger.debug(
      `Updated UserArtist stats for user ${userId}, artist ${artistId}`,
    );
  }

  /**
   * Helper to extract original track ID from album track data (handles relinking)
   */
  private getOriginalAlbumTrackId(track: SpotifyAlbumTrack): string {
    return this.getOriginalTrackId(track);
  }

  /**
   * Helper to extract original track ID from any track object (handles relinking)
   * Works with both simplified album tracks and full track objects
   */
  private getOriginalTrackId(track: {
    id: string;
    linked_from?: { id: string; uri?: string };
  }): string {
    return track.linked_from?.id || track.id;
  }
}
