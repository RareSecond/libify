import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'kysely';

import { DatabaseService } from '../database/database.service';
import { KyselyService } from '../database/kysely/kysely.service';
import { SpotifySavedAlbum } from './dto/spotify-album.dto';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private databaseService: DatabaseService,
    private kyselyService: KyselyService,
  ) {}

  async createOrUpdateAlbumEntities(
    savedAlbum: SpotifySavedAlbum,
    artistMap: Map<
      string,
      {
        genres: string[];
        id: string;
        images: Array<{ url: string }>;
        name: string;
        popularity: number;
      }
    >,
  ): Promise<{
    albumId: string;
    artistId: string;
    trackIds: string[];
  }> {
    const albumData = savedAlbum.album;

    // For now, we'll use the first artist (primary artist)
    const primaryArtist = albumData.artists[0];
    if (!primaryArtist) {
      throw new Error('Album has no artists');
    }

    // Get artist data from the pre-fetched map
    let artistImageUrl: null | string = null;
    let genres: string[] = [];
    let popularity: null | number = null;
    const artistData = artistMap.get(primaryArtist.id);
    if (artistData) {
      if (artistData.images.length > 0) {
        artistImageUrl = artistData.images[0].url;
      }
      genres = artistData.genres || [];
      popularity = artistData.popularity;
    }

    // Since we assume Spotify metadata never changes, only create artist if it doesn't exist
    let artist = await this.databaseService.spotifyArtist.findUnique({
      where: { spotifyId: primaryArtist.id },
    });

    if (!artist) {
      artist = await this.databaseService.spotifyArtist.create({
        data: {
          genres,
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
      where: {
        spotifyId: albumData.id,
      },
    });

    // Process album tracks if they're included
    const trackIds: string[] = [];
    if (albumData.tracks && albumData.tracks.items.length > 0) {
      for (const trackData of albumData.tracks.items) {
        const track = await this.databaseService.spotifyTrack.upsert({
          create: {
            albumId: album.id,
            artistId: artist.id,
            discNumber: trackData.disc_number || 1,
            duration: trackData.duration_ms,
            explicit: trackData.explicit,
            previewUrl: trackData.preview_url,
            spotifyId: trackData.id,
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
          where: {
            spotifyId: trackData.id,
          },
        });
        trackIds.push(track.id);
      }
    }

    return {
      albumId: album.id,
      artistId: artist.id,
      trackIds,
    };
  }

  async createOrUpdateSpotifyEntities(
    spotifyTrackData: {
      album: { id: string; images: Array<{ url: string }>; name: string };
      artists: Array<{ id: string; name: string }>;
      duration_ms: number;
      id: string;
      name: string;
    },
    artistMap: Map<
      string,
      {
        genres: string[];
        id: string;
        images: Array<{ url: string }>;
        name: string;
        popularity: number;
      }
    >,
  ): Promise<{
    albumId: null | string;
    artistId: string;
    trackId: string;
  }> {
    // For now, we'll use the first artist (primary artist)
    const primaryArtist = spotifyTrackData.artists[0];
    if (!primaryArtist) {
      throw new Error('Track has no artists');
    }

    // Get artist data from the pre-fetched map
    let artistImageUrl: null | string = null;
    let genres: string[] = [];
    let popularity: null | number = null;
    const artistData = artistMap.get(primaryArtist.id);
    if (artistData) {
      if (artistData.images.length > 0) {
        artistImageUrl = artistData.images[0].url;
      }
      genres = artistData.genres || [];
      popularity = artistData.popularity;
      this.logger.debug(
        `Artist ${primaryArtist.name} has ${genres.length} genres: ${genres.join(', ')}`,
      );
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
          genres,
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
      album = await this.databaseService.spotifyAlbum.create({
        data: {
          artistId: artist.id,
          imageUrl:
            spotifyTrackData.album.images.length > 0
              ? spotifyTrackData.album.images[0].url
              : null,
          name: spotifyTrackData.album.name,
          spotifyId: spotifyTrackData.album.id,
        },
      });
    }

    // Since we assume Spotify metadata never changes, only create track if it doesn't exist
    let track = await this.databaseService.spotifyTrack.findUnique({
      where: { spotifyId: spotifyTrackData.id },
    });

    if (!track) {
      track = await this.databaseService.spotifyTrack.create({
        data: {
          albumId: album.id,
          artistId: artist.id,
          duration: spotifyTrackData.duration_ms,
          spotifyId: spotifyTrackData.id,
          title: spotifyTrackData.name,
        },
      });
    }

    return {
      albumId: album.id,
      artistId: artist.id,
      trackId: track.id,
    };
  }

  /**
   * Get artist statistics without loading all data into memory
   * This replaces the PRODUCTION_DATA_ARCHITECTURE_GUIDE's $queryRaw example
   */
  async getArtistStats(userId: string, limit = 100) {
    const db = this.kyselyService.database;

    return db
      .selectFrom('UserTrack as ut')
      .innerJoin('SpotifyTrack as st', 'ut.spotifyTrackId', 'st.id')
      .innerJoin('SpotifyArtist as sar', 'st.artistId', 'sar.id')
      .where('ut.userId', '=', userId)
      .groupBy(['sar.id', 'sar.name', 'sar.imageUrl'])
      .select([
        'sar.id',
        'sar.name',
        'sar.imageUrl',
        sql<number>`COUNT(DISTINCT ut.id)::int`.as('trackCount'),
        sql<number>`SUM(ut."totalPlayCount")::int`.as('totalPlays'),
        sql<Date>`MAX(ut."lastPlayedAt")`.as('lastPlayed'),
        sql<number>`ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1)`.as(
          'avgRating',
        ),
      ])
      .orderBy('totalPlays', 'desc')
      .limit(limit)
      .execute();
  }

  async recalculateAllUserStats(userId: string): Promise<void> {
    this.logger.log(`Recalculating all stats for user ${userId}`);

    // Get all unique artists and albums for the user
    const userTracks = await this.databaseService.userTrack.findMany({
      distinct: ['spotifyTrackId'],
      include: {
        spotifyTrack: true,
      },
      where: { userId },
    });

    const artistIds = new Set<string>();
    const albumIds = new Set<string>();

    userTracks.forEach((track) => {
      artistIds.add(track.spotifyTrack.artistId);
      albumIds.add(track.spotifyTrack.albumId);
    });

    // Update all artist stats
    for (const artistId of artistIds) {
      await this.updateUserArtistStats(userId, artistId);
    }

    // Update all album stats
    for (const albumId of albumIds) {
      await this.updateUserAlbumStats(userId, albumId);
    }

    this.logger.log(
      `Recalculated stats for ${artistIds.size} artists and ${albumIds.size} albums`,
    );
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
      .selectFrom('UserTrack as ut')
      .innerJoin('SpotifyTrack as st', 'ut.spotifyTrackId', 'st.id')
      .where('ut.userId', '=', userId)
      .where('st.albumId', '=', albumId)
      .select([
        sql<number>`COUNT(*)::int`.as('trackCount'),
        sql<number>`SUM(st.duration)::int`.as('totalDuration'),
        sql<number>`SUM(ut."totalPlayCount")::int`.as('totalPlayCount'),
        sql<number>`COUNT(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::int`.as(
          'ratedTrackCount',
        ),
        sql<number>`ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1)`.as(
          'avgRating',
        ),
        sql<Date>`MIN(ut."addedAt")`.as('firstAddedAt'),
        sql<Date>`MAX(ut."lastPlayedAt")`.as('lastPlayedAt'),
      ])
      .executeTakeFirst();

    if (!stats || stats.trackCount === 0) {
      // No tracks for this album, remove the UserAlbum record if it exists
      await db
        .deleteFrom('UserAlbum')
        .where('userId', '=', userId)
        .where('albumId', '=', albumId)
        .execute();
      return;
    }

    // Upsert the aggregated stats
    await db
      .insertInto('UserAlbum')
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
        updatedAt: new Date(),
        userId,
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'albumId']).doUpdateSet({
          avgRating: stats.avgRating,
          lastPlayedAt: stats.lastPlayedAt,
          ratedTrackCount: stats.ratedTrackCount,
          totalDuration: stats.totalDuration ?? 0,
          totalPlayCount: stats.totalPlayCount ?? 0,
          trackCount: stats.trackCount,
          updatedAt: new Date(),
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
      .selectFrom('UserTrack as ut')
      .innerJoin('SpotifyTrack as st', 'ut.spotifyTrackId', 'st.id')
      .where('ut.userId', '=', userId)
      .where('st.artistId', '=', artistId)
      .select([
        sql<number>`COUNT(*)::int`.as('trackCount'),
        sql<number>`COUNT(DISTINCT st."albumId")::int`.as('albumCount'),
        sql<number>`SUM(st.duration)::int`.as('totalDuration'),
        sql<number>`SUM(ut."totalPlayCount")::int`.as('totalPlayCount'),
        sql<number>`COUNT(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::int`.as(
          'ratedTrackCount',
        ),
        sql<number>`ROUND(AVG(ut.rating) FILTER (WHERE ut.rating IS NOT NULL)::numeric, 1)`.as(
          'avgRating',
        ),
        sql<Date>`MIN(ut."addedAt")`.as('firstAddedAt'),
        sql<Date>`MAX(ut."lastPlayedAt")`.as('lastPlayedAt'),
      ])
      .executeTakeFirst();

    if (!stats || stats.trackCount === 0) {
      // No tracks for this artist, remove the UserArtist record if it exists
      await db
        .deleteFrom('UserArtist')
        .where('userId', '=', userId)
        .where('artistId', '=', artistId)
        .execute();
      return;
    }

    // Upsert the aggregated stats
    await db
      .insertInto('UserArtist')
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
        updatedAt: new Date(),
        userId,
      })
      .onConflict((oc) =>
        oc.columns(['userId', 'artistId']).doUpdateSet({
          albumCount: stats.albumCount,
          avgRating: stats.avgRating,
          lastPlayedAt: stats.lastPlayedAt,
          ratedTrackCount: stats.ratedTrackCount,
          totalDuration: stats.totalDuration ?? 0,
          totalPlayCount: stats.totalPlayCount ?? 0,
          trackCount: stats.trackCount,
          updatedAt: new Date(),
        }),
      )
      .execute();

    this.logger.debug(
      `Updated UserArtist stats for user ${userId}, artist ${artistId}`,
    );
  }
}
