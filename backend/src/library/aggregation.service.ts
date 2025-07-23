import { Injectable, Logger } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { SpotifySavedAlbum } from './dto/spotify-album.dto';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(private databaseService: DatabaseService) {}

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

    // Create or update artist
    const artist = await this.databaseService.spotifyArtist.upsert({
      create: {
        genres,
        imageUrl: artistImageUrl,
        name: primaryArtist.name,
        popularity,
        spotifyId: primaryArtist.id,
      },
      update: {
        genres,
        name: primaryArtist.name,
        ...(artistImageUrl && { imageUrl: artistImageUrl }),
        ...(popularity !== null && { popularity }),
      },
      where: {
        spotifyId: primaryArtist.id,
      },
    });

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
        imageUrl:
          albumData.images.length > 0 ? albumData.images[0].url : null,
        name: albumData.name,
        releaseDate,
        spotifyId: albumData.id,
        totalTracks: albumData.total_tracks,
      },
      update: {
        albumType: albumData.album_type,
        imageUrl:
          albumData.images.length > 0 ? albumData.images[0].url : null,
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
    const artistData = artistMap.get(primaryArtist.id);
    if (artistData && artistData.images.length > 0) {
      artistImageUrl = artistData.images[0].url;
    }

    // Create or get artist
    const artist = await this.databaseService.spotifyArtist.upsert({
      create: {
        imageUrl: artistImageUrl,
        name: primaryArtist.name,
        spotifyId: primaryArtist.id,
      },
      update: {
        name: primaryArtist.name,
        ...(artistImageUrl && { imageUrl: artistImageUrl }),
      },
      where: {
        spotifyId: primaryArtist.id,
      },
    });

    // Create or get album - always required
    const album = await this.databaseService.spotifyAlbum.upsert({
      create: {
        artistId: artist.id,
        imageUrl:
          spotifyTrackData.album.images.length > 0
            ? spotifyTrackData.album.images[0].url
            : null,
        name: spotifyTrackData.album.name,
        spotifyId: spotifyTrackData.album.id,
      },
      update: {
        imageUrl:
          spotifyTrackData.album.images.length > 0
            ? spotifyTrackData.album.images[0].url
            : null,
        name: spotifyTrackData.album.name,
      },
      where: {
        spotifyId: spotifyTrackData.album.id,
      },
    });

    // Create or update track
    const track = await this.databaseService.spotifyTrack.upsert({
      create: {
        albumId: album.id,
        artistId: artist.id,
        duration: spotifyTrackData.duration_ms,
        spotifyId: spotifyTrackData.id,
        title: spotifyTrackData.name,
      },
      update: {
        albumId: album.id,
        artistId: artist.id,
        duration: spotifyTrackData.duration_ms,
        title: spotifyTrackData.name,
      },
      where: {
        spotifyId: spotifyTrackData.id,
      },
    });

    return {
      albumId: album.id,
      artistId: artist.id,
      trackId: track.id,
    };
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
    // Get all user tracks for this album
    const tracks = await this.databaseService.userTrack.findMany({
      include: {
        spotifyTrack: true,
      },
      where: {
        spotifyTrack: {
          albumId,
        },
        userId,
      },
    });

    if (tracks.length === 0) {
      // Remove UserAlbum record if no tracks exist
      await this.databaseService.userAlbum.deleteMany({
        where: { albumId, userId },
      });
      return;
    }

    // Calculate aggregated stats
    const stats = {
      avgRating: null as null | number,
      firstAddedAt: tracks.reduce(
        (min, t) => (t.addedAt < min ? t.addedAt : min),
        tracks[0].addedAt,
      ),
      lastPlayedAt: tracks.reduce(
        (max, t) => {
          if (!t.lastPlayedAt) return max;
          if (!max) return t.lastPlayedAt;
          return t.lastPlayedAt > max ? t.lastPlayedAt : max;
        },
        null as Date | null,
      ),
      ratedTrackCount: 0,
      totalDuration: 0,
      totalPlayCount: 0,
      trackCount: tracks.length,
    };

    // Calculate average rating and other stats
    let totalRating = 0;
    tracks.forEach((track) => {
      stats.totalDuration += track.spotifyTrack.duration;
      stats.totalPlayCount += track.totalPlayCount;
      if (track.rating !== null) {
        totalRating += track.rating;
        stats.ratedTrackCount++;
      }
    });

    if (stats.ratedTrackCount > 0) {
      stats.avgRating =
        Math.round((totalRating / stats.ratedTrackCount) * 10) / 10;
    }

    // Upsert UserAlbum record
    await this.databaseService.userAlbum.upsert({
      create: {
        albumId,
        avgRating: stats.avgRating,
        firstAddedAt: stats.firstAddedAt,
        lastPlayedAt: stats.lastPlayedAt,
        ratedTrackCount: stats.ratedTrackCount,
        totalDuration: stats.totalDuration,
        totalPlayCount: stats.totalPlayCount,
        trackCount: stats.trackCount,
        userId,
      },
      update: {
        avgRating: stats.avgRating,
        lastPlayedAt: stats.lastPlayedAt,
        ratedTrackCount: stats.ratedTrackCount,
        totalDuration: stats.totalDuration,
        totalPlayCount: stats.totalPlayCount,
        trackCount: stats.trackCount,
      },
      where: {
        userId_albumId: {
          albumId,
          userId,
        },
      },
    });

    this.logger.debug(
      `Updated UserAlbum stats for user ${userId}, album ${albumId}`,
    );
  }

  async updateUserArtistStats(userId: string, artistId: string): Promise<void> {
    // Get all user tracks for this artist
    const tracks = await this.databaseService.userTrack.findMany({
      include: {
        spotifyTrack: {
          include: {
            album: true,
          },
        },
      },
      where: {
        spotifyTrack: {
          artistId,
        },
        userId,
      },
    });

    if (tracks.length === 0) {
      // Remove UserArtist record if no tracks exist
      await this.databaseService.userArtist.deleteMany({
        where: { artistId, userId },
      });
      return;
    }

    // Calculate aggregated stats
    const stats = {
      albumCount: new Set(tracks.map((t) => t.spotifyTrack.albumId)).size,
      avgRating: null as null | number,
      firstAddedAt: tracks.reduce(
        (min, t) => (t.addedAt < min ? t.addedAt : min),
        tracks[0].addedAt,
      ),
      lastPlayedAt: tracks.reduce(
        (max, t) => {
          if (!t.lastPlayedAt) return max;
          if (!max) return t.lastPlayedAt;
          return t.lastPlayedAt > max ? t.lastPlayedAt : max;
        },
        null as Date | null,
      ),
      ratedTrackCount: 0,
      totalDuration: 0,
      totalPlayCount: 0,
      trackCount: tracks.length,
    };

    // Calculate average rating and other stats
    let totalRating = 0;
    tracks.forEach((track) => {
      stats.totalDuration += track.spotifyTrack.duration;
      stats.totalPlayCount += track.totalPlayCount;
      if (track.rating !== null) {
        totalRating += track.rating;
        stats.ratedTrackCount++;
      }
    });

    if (stats.ratedTrackCount > 0) {
      stats.avgRating =
        Math.round((totalRating / stats.ratedTrackCount) * 10) / 10;
    }

    // Upsert UserArtist record
    await this.databaseService.userArtist.upsert({
      create: {
        albumCount: stats.albumCount,
        artistId,
        avgRating: stats.avgRating,
        firstAddedAt: stats.firstAddedAt,
        lastPlayedAt: stats.lastPlayedAt,
        ratedTrackCount: stats.ratedTrackCount,
        totalDuration: stats.totalDuration,
        totalPlayCount: stats.totalPlayCount,
        trackCount: stats.trackCount,
        userId,
      },
      update: {
        albumCount: stats.albumCount,
        avgRating: stats.avgRating,
        lastPlayedAt: stats.lastPlayedAt,
        ratedTrackCount: stats.ratedTrackCount,
        totalDuration: stats.totalDuration,
        totalPlayCount: stats.totalPlayCount,
        trackCount: stats.trackCount,
      },
      where: {
        userId_artistId: {
          artistId,
          userId,
        },
      },
    });

    this.logger.debug(
      `Updated UserArtist stats for user ${userId}, artist ${artistId}`,
    );
  }
}
