import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

import { DatabaseService } from '../database/database.service';
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
    private spotifyService: SpotifyService,
    private aggregationService: AggregationService,
  ) {}

  async getAlbumTracks(userId: string, artist: string, album: string) {
    const tracks = await this.databaseService.userTrack.findMany({
      include: {
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
      orderBy: {
        spotifyTrack: {
          title: 'asc',
        },
      },
      where: {
        spotifyTrack: {
          album: {
            name: album,
          },
          artist: {
            name: artist,
          },
        },
        userId,
      },
    });

    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.spotifyTrack.album.name,
        albumArt: track.spotifyTrack.album.imageUrl || null,
        artist: track.spotifyTrack.artist.name,
        duration: track.spotifyTrack.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
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

    return { tracks: trackDtos };
  }

  async getArtistTracks(userId: string, artist: string) {
    const tracks = await this.databaseService.userTrack.findMany({
      include: {
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
      orderBy: [
        {
          spotifyTrack: {
            album: {
              name: 'asc',
            },
          },
        },
        {
          spotifyTrack: {
            title: 'asc',
          },
        },
      ],
      where: {
        spotifyTrack: {
          artist: {
            name: artist,
          },
        },
        userId,
      },
    });

    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.spotifyTrack.album.name,
        albumArt: track.spotifyTrack.album.imageUrl || null,
        artist: track.spotifyTrack.artist.name,
        duration: track.spotifyTrack.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
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

    return trackDtos;
  }

  async getTrackById(
    userId: string,
    trackId: string,
  ): Promise<null | TrackDto> {
    const track = await this.databaseService.userTrack.findFirst({
      include: {
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
      duration: track.spotifyTrack.duration,
      id: track.id,
      lastPlayedAt: track.lastPlayedAt,
      ratedAt: track.ratedAt,
      rating: track.rating,
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

  async getUserAlbums(
    userId: string,
    options: {
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

  async getUserTracks(
    userId: string,
    query: GetTracksQueryDto,
  ): Promise<PaginatedTracksDto> {
    const {
      minRating,
      page = 1,
      pageSize = 20,
      search,
      sortBy = 'addedAt',
      sortOrder = 'desc',
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
        duration: track.spotifyTrack.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
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
