import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

import { DatabaseService } from '../database/database.service';
import { GetTracksQueryDto, PaginatedTracksDto, TrackDto } from './dto/track.dto';

@Injectable()
export class TrackService {
  constructor(private databaseService: DatabaseService) {}

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
