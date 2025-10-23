import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { sql } from 'kysely';

import { DatabaseService } from '../database/database.service';
import { KyselyService } from '../database/kysely/kysely.service';
import { AggregationService } from './aggregation.service';
import { AlbumDto, PaginatedAlbumsDto } from './dto/album.dto';
import { ArtistDto, PaginatedArtistsDto } from './dto/artist.dto';
import {
  GetTracksQueryDto,
  PaginatedTracksDto,
  TrackDto,
} from './dto/track.dto';
import { SpotifyService } from './spotify.service';

// Interfaces removed - using direct database queries with UserAlbum and UserArtist models

@Injectable()
export class TrackService {
  constructor(
    private databaseService: DatabaseService,
    private kyselyService: KyselyService,
    private spotifyService: SpotifyService,
    private aggregationService: AggregationService,
  ) {}

  async getAlbumTracks(
    userId: string,
    artist: string,
    album: string,
  ): Promise<{ tracks: TrackDto[] }> {
    const db = this.kyselyService.database;

    // Single optimized query with all joins
    const tracks = await db
      .selectFrom('UserTrack as ut')
      .innerJoin('SpotifyTrack as st', 'ut.spotifyTrackId', 'st.id')
      .innerJoin('SpotifyAlbum as sa', 'st.albumId', 'sa.id')
      .innerJoin('SpotifyArtist as sar', 'st.artistId', 'sar.id')
      .leftJoin('TrackTag as tt', 'ut.id', 'tt.userTrackId')
      .leftJoin('Tag as t', 'tt.tagId', 't.id')
      .leftJoin('TrackSource as ts', 'ut.id', 'ts.userTrackId')
      .select([
        'ut.id',
        'ut.addedAt',
        'ut.lastPlayedAt',
        'ut.totalPlayCount',
        'ut.rating',
        'ut.ratedAt',
        'st.spotifyId',
        'st.title',
        'st.duration',
        'sa.name as albumName',
        'sa.imageUrl as albumImageUrl',
        'sar.name as artistName',
        'sar.genres as artistGenres',
        // Aggregate tags into array
        sql<Array<{ color: null | string; id: string; name: string }>>`
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', t.id,
                'name', t.name,
                'color', t.color
              )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
          )`.as('tags'),
        // Aggregate sources into array
        sql<
          Array<{
            createdAt: Date;
            id: string;
            sourceId: null | string;
            sourceName: null | string;
            sourceType: string;
          }>
        >`
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', ts.id,
                'sourceType', ts."sourceType",
                'sourceName', ts."sourceName",
                'sourceId', ts."sourceId",
                'createdAt', ts."createdAt"
              )
            ) FILTER (WHERE ts.id IS NOT NULL),
            '[]'::json
          )`.as('sources'),
      ])
      .where('ut.userId', '=', userId)
      .where('sar.name', '=', artist)
      .where('sa.name', '=', album)
      .groupBy([
        'ut.id',
        'ut.addedAt',
        'ut.lastPlayedAt',
        'ut.totalPlayCount',
        'ut.rating',
        'ut.ratedAt',
        'st.spotifyId',
        'st.title',
        'st.duration',
        'sa.name',
        'sa.imageUrl',
        'sar.name',
        'sar.genres',
      ])
      .orderBy('st.title', 'asc')
      .execute();

    // Transform to DTOs
    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.albumName,
        albumArt: track.albumImageUrl,
        artist: track.artistName,
        artistGenres: track.artistGenres,
        duration: track.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
        sources: track.sources,
        spotifyId: track.spotifyId,
        tags: track.tags,
        title: track.title,
        totalPlayCount: track.totalPlayCount,
      };
      return plainToInstance(TrackDto, dto, { excludeExtraneousValues: true });
    });

    return { tracks: trackDtos };
  }

  async getArtistTracks(
    userId: string,
    artist: string,
  ): Promise<{ tracks: TrackDto[] }> {
    const db = this.kyselyService.database;

    const tracks = await db
      .selectFrom('UserTrack as ut')
      .innerJoin('SpotifyTrack as st', 'ut.spotifyTrackId', 'st.id')
      .innerJoin('SpotifyAlbum as sa', 'st.albumId', 'sa.id')
      .innerJoin('SpotifyArtist as sar', 'st.artistId', 'sar.id')
      .leftJoin('TrackTag as tt', 'ut.id', 'tt.userTrackId')
      .leftJoin('Tag as t', 'tt.tagId', 't.id')
      .leftJoin('TrackSource as ts', 'ut.id', 'ts.userTrackId')
      .select([
        'ut.id',
        'ut.addedAt',
        'ut.lastPlayedAt',
        'ut.totalPlayCount',
        'ut.rating',
        'ut.ratedAt',
        'st.spotifyId',
        'st.title',
        'st.duration',
        'sa.name as albumName',
        'sa.imageUrl as albumImageUrl',
        'sar.name as artistName',
        'sar.genres as artistGenres',
        sql<Array<{ color: null | string; id: string; name: string }>>`
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', t.id,
                'name', t.name,
                'color', t.color
              )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::json
          )`.as('tags'),
        sql<
          Array<{
            createdAt: Date;
            id: string;
            sourceId: null | string;
            sourceName: null | string;
            sourceType: string;
          }>
        >`
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', ts.id,
                'sourceType', ts."sourceType",
                'sourceName', ts."sourceName",
                'sourceId', ts."sourceId",
                'createdAt', ts."createdAt"
              )
            ) FILTER (WHERE ts.id IS NOT NULL),
            '[]'::json
          )`.as('sources'),
      ])
      .where('ut.userId', '=', userId)
      .where('sar.name', '=', artist)
      .groupBy([
        'ut.id',
        'ut.addedAt',
        'ut.lastPlayedAt',
        'ut.totalPlayCount',
        'ut.rating',
        'ut.ratedAt',
        'st.spotifyId',
        'st.title',
        'st.duration',
        'sa.name',
        'sa.imageUrl',
        'sar.name',
        'sar.genres',
      ])
      .orderBy('sa.name', 'asc')
      .orderBy('st.title', 'asc')
      .execute();

    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.albumName,
        albumArt: track.albumImageUrl,
        artist: track.artistName,
        artistGenres: track.artistGenres,
        duration: track.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
        sources: track.sources,
        spotifyId: track.spotifyId,
        tags: track.tags,
        title: track.title,
        totalPlayCount: track.totalPlayCount,
      };
      return plainToInstance(TrackDto, dto, { excludeExtraneousValues: true });
    });

    return { tracks: trackDtos };
  }

  async getTrackById(
    userId: string,
    trackId: string,
  ): Promise<null | TrackDto> {
    const track = await this.databaseService.userTrack.findFirst({
      include: {
        sources: true,
        spotifyTrack: {
          include: {
            album: {
              include: {
                artist: true,
              },
            },
            artist: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      where: {
        id: trackId,
        userId,
      },
    });

    if (!track) {
      return null;
    }

    const dto = {
      addedAt: track.addedAt,
      album: track.spotifyTrack.album?.name || null,
      albumArt: track.spotifyTrack.album?.imageUrl || null,
      artist: track.spotifyTrack.artist.name,
      artistGenres: track.spotifyTrack.artist.genres,
      duration: track.spotifyTrack.duration,
      id: track.id,
      lastPlayedAt: track.lastPlayedAt,
      ratedAt: track.ratedAt,
      rating: track.rating,
      sources: track.sources.map((s) => ({
        createdAt: s.createdAt,
        id: s.id,
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        sourceType: s.sourceType,
      })),
      spotifyId: track.spotifyTrack.spotifyId,
      tags: track.tags.map((t) => ({
        color: t.tag.color,
        id: t.tag.id,
        name: t.tag.name,
      })),
      title: track.spotifyTrack.title,
      totalPlayCount: track.totalPlayCount,
    };

    return plainToInstance(TrackDto, dto, { excludeExtraneousValues: true });
  }

  /**
   * Get tracks with cursor-based pagination for better performance
   * Implements solution from PRODUCTION_DATA_ARCHITECTURE_GUIDE.md
   */
  async getTracksWithCursor(
    userId: string,
    cursor?: { addedAt: Date; id: string },
    limit = 50,
  ) {
    const db = this.kyselyService.database;

    let query = db
      .selectFrom('UserTrack as ut')
      .innerJoin('SpotifyTrack as st', 'ut.spotifyTrackId', 'st.id')
      .innerJoin('SpotifyAlbum as sa', 'st.albumId', 'sa.id')
      .innerJoin('SpotifyArtist as sar', 'st.artistId', 'sar.id')
      .select([
        'ut.id',
        'ut.addedAt',
        'ut.lastPlayedAt',
        'ut.totalPlayCount',
        'ut.rating',
        'ut.ratedAt',
        'st.spotifyId',
        'st.title',
        'st.duration',
        'sa.name as albumName',
        'sa.imageUrl as albumImageUrl',
        'sar.name as artistName',
      ])
      .where('ut.userId', '=', userId)
      .orderBy('ut.addedAt', 'desc')
      .orderBy('ut.id', 'asc') // Stable sort tiebreaker
      .limit(limit + 1); // Fetch one extra to check if more exist

    // Apply cursor if provided
    if (cursor) {
      query = query.where((eb) =>
        eb.or([
          eb('ut.addedAt', '<', cursor.addedAt),
          eb.and([
            eb('ut.addedAt', '=', cursor.addedAt),
            eb('ut.id', '>', cursor.id),
          ]),
        ]),
      );
    }

    const tracks = await query.execute();

    const hasMore = tracks.length > limit;
    const items = hasMore ? tracks.slice(0, -1) : tracks;

    const nextCursor = hasMore
      ? {
          addedAt: items[items.length - 1].addedAt,
          id: items[items.length - 1].id,
        }
      : null;

    return {
      hasMore,
      items: items.map((track) =>
        plainToInstance(
          TrackDto,
          {
            addedAt: track.addedAt,
            album: track.albumName,
            albumArt: track.albumImageUrl,
            artist: track.artistName,
            duration: track.duration,
            id: track.id,
            lastPlayedAt: track.lastPlayedAt,
            ratedAt: track.ratedAt,
            rating: track.rating,
            spotifyId: track.spotifyId,
            title: track.title,
            totalPlayCount: track.totalPlayCount,
          },
          { excludeExtraneousValues: true },
        ),
      ),
      nextCursor,
    };
  }

  async getUserAlbums(
    userId: string,
    options: {
      genres?: string[];
      page: number;
      pageSize: number;
      search?: string;
      sortBy:
        | 'artist'
        | 'avgRating'
        | 'lastPlayed'
        | 'name'
        | 'totalPlayCount'
        | 'trackCount';
      sortOrder: 'asc' | 'desc';
    },
  ): Promise<PaginatedAlbumsDto> {
    // Build where clause
    const where: Prisma.UserAlbumWhereInput = {
      userId,
    };

    // Add search filter
    if (options.search) {
      where.OR = [
        {
          album: {
            name: { contains: options.search, mode: 'insensitive' },
          },
        },
        {
          album: {
            artist: {
              name: { contains: options.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Add genre filter
    if (options.genres && options.genres.length > 0) {
      const genreFilter: Prisma.UserAlbumWhereInput = {
        album: {
          artist: {
            genres: {
              hasSome: options.genres,
            },
          },
        },
      };

      if (where.OR) {
        // If we already have OR conditions from search, wrap everything in AND
        where.AND = [{ OR: where.OR }, genreFilter];
        delete where.OR;
      } else {
        // Otherwise just add the genre filter
        Object.assign(where, genreFilter);
      }
    }

    // Build orderBy clause
    let orderBy: Prisma.UserAlbumOrderByWithRelationInput = {};
    switch (options.sortBy) {
      case 'artist':
        orderBy = { album: { artist: { name: options.sortOrder } } };
        break;
      case 'avgRating':
        orderBy = { avgRating: options.sortOrder };
        break;
      case 'lastPlayed':
        orderBy = { lastPlayedAt: options.sortOrder };
        break;
      case 'name':
        orderBy = { album: { name: options.sortOrder } };
        break;
      case 'totalPlayCount':
        orderBy = { totalPlayCount: options.sortOrder };
        break;
      case 'trackCount':
        orderBy = { trackCount: options.sortOrder };
        break;
    }

    // Calculate pagination
    const skip = (options.page - 1) * options.pageSize;

    // Execute queries
    const [userAlbums, total] = await Promise.all([
      this.databaseService.userAlbum.findMany({
        include: {
          album: {
            include: {
              artist: true,
            },
          },
        },
        orderBy,
        skip,
        take: options.pageSize,
        where,
      }),
      this.databaseService.userAlbum.count({ where }),
    ]);

    // Transform to DTOs
    const albumDtos = userAlbums.map((userAlbum) => {
      return plainToInstance(
        AlbumDto,
        {
          albumArt: userAlbum.album.imageUrl,
          artist: userAlbum.album.artist.name,
          artistGenres: userAlbum.album.artist.genres,
          avgRating: userAlbum.avgRating,
          firstAdded: userAlbum.firstAddedAt,
          lastPlayed: userAlbum.lastPlayedAt,
          name: userAlbum.album.name,
          totalDuration: userAlbum.totalDuration,
          totalPlayCount: userAlbum.totalPlayCount,
          trackCount: userAlbum.trackCount,
        },
        { excludeExtraneousValues: true },
      );
    });

    const totalPages = Math.ceil(total / options.pageSize);

    return plainToInstance(
      PaginatedAlbumsDto,
      {
        albums: albumDtos,
        page: options.page,
        pageSize: options.pageSize,
        total,
        totalPages,
      },
      { excludeExtraneousValues: true },
    );
  }

  async getUserArtists(
    userId: string,
    options: {
      genres?: string[];
      page: number;
      pageSize: number;
      search?: string;
      sortBy:
        | 'albumCount'
        | 'avgRating'
        | 'lastPlayed'
        | 'name'
        | 'totalPlayCount'
        | 'trackCount';
      sortOrder: 'asc' | 'desc';
    },
  ): Promise<PaginatedArtistsDto> {
    // Build where clause
    const where: Prisma.UserArtistWhereInput = {
      userId,
    };

    // Add search filter
    if (options.search) {
      where.artist = {
        name: { contains: options.search, mode: 'insensitive' },
      };
    }

    // Add genre filter
    if (options.genres && options.genres.length > 0) {
      if (options.search) {
        // If we have both search and genre filter, we need to combine them
        where.artist = {
          AND: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { genres: { hasSome: options.genres } },
          ],
        };
      } else {
        // Just genre filter
        where.artist = {
          genres: { hasSome: options.genres },
        };
      }
    }

    // Build orderBy clause
    let orderBy: Prisma.UserArtistOrderByWithRelationInput = {};
    switch (options.sortBy) {
      case 'albumCount':
        orderBy = { albumCount: options.sortOrder };
        break;
      case 'avgRating':
        orderBy = { avgRating: options.sortOrder };
        break;
      case 'lastPlayed':
        orderBy = { lastPlayedAt: options.sortOrder };
        break;
      case 'name':
        orderBy = { artist: { name: options.sortOrder } };
        break;
      case 'totalPlayCount':
        orderBy = { totalPlayCount: options.sortOrder };
        break;
      case 'trackCount':
        orderBy = { trackCount: options.sortOrder };
        break;
    }

    // Calculate pagination
    const skip = (options.page - 1) * options.pageSize;

    // Execute queries
    const [userArtists, total] = await Promise.all([
      this.databaseService.userArtist.findMany({
        include: {
          artist: true,
        },
        orderBy,
        skip,
        take: options.pageSize,
        where,
      }),
      this.databaseService.userArtist.count({ where }),
    ]);

    // Transform to DTOs
    const artistDtos = userArtists.map((userArtist) => {
      return plainToInstance(
        ArtistDto,
        {
          albumCount: userArtist.albumCount,
          artistImage: userArtist.artist.imageUrl,
          avgRating: userArtist.avgRating,
          firstAdded: userArtist.firstAddedAt,
          genres: userArtist.artist.genres,
          lastPlayed: userArtist.lastPlayedAt,
          name: userArtist.artist.name,
          totalDuration: userArtist.totalDuration,
          totalPlayCount: userArtist.totalPlayCount,
          trackCount: userArtist.trackCount,
        },
        { excludeExtraneousValues: true },
      );
    });

    const totalPages = Math.ceil(total / options.pageSize);

    return plainToInstance(
      PaginatedArtistsDto,
      {
        artists: artistDtos,
        page: options.page,
        pageSize: options.pageSize,
        total,
        totalPages,
      },
      { excludeExtraneousValues: true },
    );
  }

  async getUserGenres(userId: string): Promise<string[]> {
    // Get all unique genres from artists in user's library
    const userArtists = await this.databaseService.userArtist.findMany({
      include: {
        artist: {
          select: {
            genres: true,
          },
        },
      },
      where: {
        userId,
      },
    });

    // Extract and flatten all genres
    const allGenres = userArtists
      .map((ua) => ua.artist.genres)
      .flat()
      .filter((genre) => genre && genre.length > 0);

    // Return unique genres sorted alphabetically
    return [...new Set(allGenres)].sort();
  }

  async getUserTracks(
    userId: string,
    query: GetTracksQueryDto,
  ): Promise<PaginatedTracksDto> {
    const {
      genres,
      minRating,
      page = 1,
      pageSize = 20,
      search,
      sortBy = 'addedAt',
      sortOrder = 'desc',
      sourceTypes,
      tagIds,
    } = query;

    // Build where clause
    const where: Prisma.UserTrackWhereInput = {
      userId,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { spotifyTrack: { title: { contains: search, mode: 'insensitive' } } },
        {
          spotifyTrack: {
            artist: { name: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          spotifyTrack: {
            album: { name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    // Add tag filter
    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    // Add rating filter
    if (minRating) {
      where.rating = {
        gte: minRating,
      };
    }

    // Add source type filter
    if (sourceTypes && sourceTypes.length > 0) {
      where.sources = {
        some: {
          sourceType: { in: sourceTypes },
        },
      };
    }

    // Add genre filter
    if (genres && genres.length > 0) {
      const genreFilter: Prisma.UserTrackWhereInput = {
        spotifyTrack: {
          artist: {
            genres: {
              hasSome: genres,
            },
          },
        },
      };

      if (where.OR) {
        // If we already have OR conditions from search, wrap everything in AND
        where.AND = [{ OR: where.OR }, genreFilter];
        delete where.OR;
      } else {
        // Otherwise just add the genre filter
        Object.assign(where, genreFilter);
      }
    }

    // Build orderBy clause
    let orderBy: Prisma.UserTrackOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'addedAt':
        orderBy = { addedAt: sortOrder };
        break;
      case 'album':
        orderBy = { spotifyTrack: { album: { name: sortOrder } } };
        break;
      case 'artist':
        orderBy = { spotifyTrack: { artist: { name: sortOrder } } };
        break;
      case 'lastPlayedAt':
        orderBy = { lastPlayedAt: sortOrder };
        break;
      case 'rating':
        orderBy = { rating: sortOrder };
        break;
      case 'title':
        orderBy = { spotifyTrack: { title: sortOrder } };
        break;
      case 'totalPlayCount':
        orderBy = { totalPlayCount: sortOrder };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Execute queries
    const [tracks, total] = await Promise.all([
      this.databaseService.userTrack.findMany({
        include: {
          sources: true,
          spotifyTrack: {
            include: {
              album: {
                include: {
                  artist: true,
                },
              },
              artist: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
        where,
      }),
      this.databaseService.userTrack.count({ where }),
    ]);

    // Transform to DTOs
    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.spotifyTrack.album.name,
        albumArt: track.spotifyTrack.album.imageUrl || null,
        artist: track.spotifyTrack.artist.name,
        artistGenres: track.spotifyTrack.artist.genres,
        duration: track.spotifyTrack.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
        sources: track.sources.map((s) => ({
          createdAt: s.createdAt,
          id: s.id,
          sourceId: s.sourceId,
          sourceName: s.sourceName,
          sourceType: s.sourceType,
        })),
        spotifyId: track.spotifyTrack.spotifyId,
        tags: track.tags.map((t) => ({
          color: t.tag.color,
          id: t.tag.id,
          name: t.tag.name,
        })),
        title: track.spotifyTrack.title,
        totalPlayCount: track.totalPlayCount,
      };
      return plainToInstance(TrackDto, dto, { excludeExtraneousValues: true });
    });

    const totalPages = Math.ceil(total / pageSize);

    return plainToInstance(
      PaginatedTracksDto,
      {
        page,
        pageSize,
        total,
        totalPages,
        tracks: trackDtos,
      },
      { excludeExtraneousValues: true },
    );
  }

  async recordPlay(userId: string, trackId: string): Promise<void> {
    // Get the user track to ensure it exists and belongs to the user
    const userTrack = await this.databaseService.userTrack.findFirst({
      where: { id: trackId, userId },
    });

    if (!userTrack) {
      throw new Error('Track not found');
    }

    // Create a play history record
    await this.databaseService.playHistory.create({
      data: {
        playedAt: new Date(),
        userTrackId: trackId,
      },
    });

    // Update the user track with incremented play count and last played timestamp
    await this.databaseService.userTrack.update({
      data: {
        lastPlayedAt: new Date(),
        totalPlayCount: {
          increment: 1,
        },
      },
      where: { id: trackId },
    });

    // Update aggregated stats for the artist and album
    await this.aggregationService.updateStatsForTrack(
      userId,
      userTrack.spotifyTrackId,
    );
  }

  async updateTrackRating(
    userId: string,
    trackId: string,
    rating: number,
  ): Promise<number> {
    const track = await this.databaseService.userTrack.findFirst({
      where: { id: trackId, userId },
    });

    if (!track) {
      throw new Error('Track not found');
    }

    const updated = await this.databaseService.userTrack.update({
      data: {
        ratedAt: new Date(),
        rating,
      },
      where: { id: trackId },
    });

    // Update aggregated stats
    await this.aggregationService.updateStatsForTrack(
      userId,
      track.spotifyTrackId,
    );

    return updated.rating;
  }
}
