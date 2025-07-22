import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

import { DatabaseService } from '../database/database.service';
import { AlbumDto, PaginatedAlbumsDto } from './dto/album.dto';
import { GetTracksQueryDto, PaginatedTracksDto, TrackDto } from './dto/track.dto';

@Injectable()
export class TrackService {
  constructor(private databaseService: DatabaseService) {}

  async getAlbumTracks(userId: string, artist: string, album: string) {
    const tracks = await this.databaseService.userTrack.findMany({
      include: {
        spotifyTrack: true,
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
          album,
          artist,
        },
        userId,
      },
    });

    const trackDtos = tracks.map(track => {
      const dto = {
        addedAt: track.addedAt,
        album: track.spotifyTrack.album,
        albumArt: track.spotifyTrack.albumArt,
        artist: track.spotifyTrack.artist,
        duration: track.spotifyTrack.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
        spotifyId: track.spotifyTrack.spotifyId,
        tags: track.tags.map(t => ({
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

  async getTrackById(userId: string, trackId: string): Promise<null | TrackDto> {
    const track = await this.databaseService.userTrack.findFirst({
      include: {
        spotifyTrack: true,
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
      album: track.spotifyTrack.album,
      albumArt: track.spotifyTrack.albumArt,
      artist: track.spotifyTrack.artist,
      duration: track.spotifyTrack.duration,
      id: track.id,
      lastPlayedAt: track.lastPlayedAt,
      ratedAt: track.ratedAt,
      rating: track.rating,
      spotifyId: track.spotifyTrack.spotifyId,
      tags: track.tags.map(t => ({
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
      sortBy: 'artist' | 'avgRating' | 'lastPlayed' | 'name' | 'totalPlayCount' | 'trackCount';
      sortOrder: 'asc' | 'desc';
    }
  ): Promise<PaginatedAlbumsDto> {
    // Get all unique albums with aggregated data
    const tracks = await this.databaseService.userTrack.findMany({
      include: {
        spotifyTrack: true,
      },
      orderBy: {
        spotifyTrack: {
          album: 'asc'
        }
      },
      where: { 
        spotifyTrack: {
          album: {
            not: null
          }
        },
        userId
      }
    });

    // Group tracks by album
    const albumsMap = new Map<string, any>();
    
    tracks.forEach(track => {
      const album = track.spotifyTrack.album;
      if (!album) return;
      
      if (!albumsMap.has(album)) {
        albumsMap.set(album, {
          albumArt: track.spotifyTrack.albumArt,
          artist: track.spotifyTrack.artist,
          avgRating: 0,
          firstAdded: track.addedAt,
          lastPlayed: track.lastPlayedAt,
          name: album,
          ratedCount: 0,
          totalDuration: 0,
          totalPlayCount: 0,
          trackCount: 0,
        });
      }
      
      const albumData = albumsMap.get(album);
      albumData.trackCount++;
      albumData.totalDuration += track.spotifyTrack.duration;
      albumData.totalPlayCount += track.totalPlayCount;
      
      if (track.rating) {
        albumData.avgRating = ((albumData.avgRating * albumData.ratedCount) + track.rating) / (albumData.ratedCount + 1);
        albumData.ratedCount++;
      }
      
      if (!albumData.firstAdded || track.addedAt < albumData.firstAdded) {
        albumData.firstAdded = track.addedAt;
      }
      
      if (track.lastPlayedAt && (!albumData.lastPlayed || track.lastPlayedAt > albumData.lastPlayed)) {
        albumData.lastPlayed = track.lastPlayedAt;
      }
    });

    // Convert map to array and format
    let allAlbums = Array.from(albumsMap.values()).map(album => ({
      ...album,
      avgRating: album.ratedCount > 0 ? Math.round(album.avgRating * 10) / 10 : null,
    }));

    // Apply search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      allAlbums = allAlbums.filter(album => 
        album.name.toLowerCase().includes(searchLower) ||
        album.artist.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    allAlbums.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (options.sortBy) {
        case 'artist':
          aVal = a.artist.toLowerCase();
          bVal = b.artist.toLowerCase();
          break;
        case 'avgRating':
          aVal = a.avgRating || 0;
          bVal = b.avgRating || 0;
          break;
        case 'lastPlayed':
          aVal = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
          bVal = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'totalPlayCount':
          aVal = a.totalPlayCount;
          bVal = b.totalPlayCount;
          break;
        case 'trackCount':
          aVal = a.trackCount;
          bVal = b.trackCount;
          break;
      }
      
      if (options.sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    // Apply pagination
    const total = allAlbums.length;
    const totalPages = Math.ceil(total / options.pageSize);
    const skip = (options.page - 1) * options.pageSize;
    const paginatedAlbums = allAlbums.slice(skip, skip + options.pageSize);

    const albumDtos = plainToInstance(AlbumDto, paginatedAlbums, { excludeExtraneousValues: true });

    return plainToInstance(PaginatedAlbumsDto, {
      albums: albumDtos,
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages,
    }, { excludeExtraneousValues: true });
  }

  async getUserTracks(userId: string, query: GetTracksQueryDto): Promise<PaginatedTracksDto> {
    const { minRating, page = 1, pageSize = 20, search, sortBy = 'addedAt', sortOrder = 'desc', tagIds } = query;
    
    // Build where clause
    const where: Prisma.UserTrackWhereInput = {
      userId,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { spotifyTrack: { title: { contains: search, mode: 'insensitive' } } },
        { spotifyTrack: { artist: { contains: search, mode: 'insensitive' } } },
        { spotifyTrack: { album: { contains: search, mode: 'insensitive' } } },
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
        orderBy = { spotifyTrack: { album: sortOrder } };
        break;
      case 'artist':
        orderBy = { spotifyTrack: { artist: sortOrder } };
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
          spotifyTrack: true,
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
    const trackDtos = tracks.map(track => {
      const dto = {
        addedAt: track.addedAt,
        album: track.spotifyTrack.album,
        albumArt: track.spotifyTrack.albumArt,
        artist: track.spotifyTrack.artist,
        duration: track.spotifyTrack.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
        spotifyId: track.spotifyTrack.spotifyId,
        tags: track.tags.map(t => ({
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

    return plainToInstance(PaginatedTracksDto, {
      page,
      pageSize,
      total,
      totalPages,
      tracks: trackDtos,
    }, { excludeExtraneousValues: true });
  }

  async updateTrackRating(userId: string, trackId: string, rating: number): Promise<number> {
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

    return updated.rating;
  }
}
