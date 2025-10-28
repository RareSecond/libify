import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DatabaseService } from '../database/database.service';
import { PlaylistCriteriaDto } from './dto/playlist-criteria.dto';
import {
  PlaylistRuleDto,
  PlaylistRuleField,
  PlaylistRuleOperator,
} from './dto/playlist-rule.dto';
import {
  CreateSmartPlaylistDto,
  UpdateSmartPlaylistDto,
} from './dto/smart-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(userId: string, createDto: CreateSmartPlaylistDto) {
    return this.prisma.smartPlaylist.create({
      data: {
        criteria: createDto.criteria as unknown as Prisma.JsonObject,
        description: createDto.description,
        isActive: createDto.isActive ?? true,
        name: createDto.name,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    const playlists = await this.prisma.smartPlaylist.findMany({
      orderBy: { createdAt: 'desc' },
      where: { userId },
    });

    // Count tracks for each playlist
    const playlistsWithCounts = await Promise.all(
      playlists.map(async (playlist) => {
        const trackCount = await this.getTrackCount(
          userId,
          playlist.criteria as unknown as PlaylistCriteriaDto,
        );
        return {
          ...playlist,
          criteria: playlist.criteria as unknown as PlaylistCriteriaDto,
          trackCount,
        };
      }),
    );

    return playlistsWithCounts;
  }

  async findOne(userId: string, playlistId: string) {
    const playlist = await this.prisma.smartPlaylist.findFirst({
      where: { id: playlistId, userId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    const trackCount = await this.getTrackCount(
      userId,
      playlist.criteria as unknown as PlaylistCriteriaDto,
    );

    return {
      ...playlist,
      criteria: playlist.criteria as unknown as PlaylistCriteriaDto,
      trackCount,
    };
  }

  async getTracks(
    userId: string,
    playlistId: string,
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ) {
    const playlist = await this.findOne(userId, playlistId);
    const criteria = playlist.criteria as unknown as PlaylistCriteriaDto;

    const where = this.buildWhereClause(userId, criteria);
    const orderBy = sortBy
      ? this.buildOrderByClause(sortBy, sortOrder || 'desc')
      : this.buildOrderBy(criteria);

    const skip = (page - 1) * pageSize;
    const take = criteria.limit
      ? Math.min(pageSize, criteria.limit - skip)
      : pageSize;

    const [tracks, total] = await Promise.all([
      this.prisma.userTrack.findMany({
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
        take,
        where,
      }),
      this.prisma.userTrack.count({ where }),
    ]);

    const formattedTracks = tracks.map((track) => ({
      addedAt: track.addedAt,
      album: track.spotifyTrack.album.name,
      albumArt: track.spotifyTrack.album.imageUrl || null,
      artist: track.spotifyTrack.artist.name,
      artistGenres: track.spotifyTrack.artist.genres || [],
      duration: track.spotifyTrack.duration,
      id: track.id,
      lastPlayedAt: track.lastPlayedAt || null,
      ratedAt: track.ratedAt || null,
      rating: track.rating || null,
      sources: track.sources.map((s) => ({
        createdAt: s.createdAt,
        id: s.id,
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        sourceType: s.sourceType,
      })),
      spotifyId: track.spotifyTrack.spotifyId,
      tags: track.tags.map((tt) => ({
        color: tt.tag.color,
        id: tt.tag.id,
        name: tt.tag.name,
      })),
      title: track.spotifyTrack.title,
      totalPlayCount: track.totalPlayCount,
    }));

    const totalToReturn = criteria.limit
      ? Math.min(total, criteria.limit)
      : total;

    return {
      page,
      pageSize: take,
      total: totalToReturn,
      totalPages: Math.ceil(totalToReturn / pageSize),
      tracks: formattedTracks,
    };
  }

  async getTracksForPlay(
    userId: string,
    playlistId: string,
    shuffle = false,
  ): Promise<string[]> {
    const playlist = await this.findOne(userId, playlistId);
    const criteria = playlist.criteria as unknown as PlaylistCriteriaDto;

    const where = this.buildWhereClause(userId, criteria);
    const orderBy = this.buildOrderBy(criteria);

    // Get all tracks up to playlist limit (or 500 max for Spotify API compatibility)
    const maxTracks = criteria.limit ? Math.min(criteria.limit, 500) : 500;

    const tracks = await this.prisma.userTrack.findMany({
      include: {
        spotifyTrack: {
          select: {
            spotifyId: true,
          },
        },
      },
      orderBy,
      take: maxTracks,
      where,
    });

    const spotifyUris = tracks
      .filter((track) => track.spotifyTrack.spotifyId)
      .map((track) => `spotify:track:${track.spotifyTrack.spotifyId}`);

    // Shuffle if requested
    if (shuffle) {
      for (let i = spotifyUris.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spotifyUris[i], spotifyUris[j]] = [spotifyUris[j], spotifyUris[i]];
      }
    }

    return spotifyUris;
  }

  async remove(userId: string, playlistId: string) {
    await this.findOne(userId, playlistId); // Check ownership
    await this.prisma.smartPlaylist.delete({
      where: { id: playlistId },
    });
  }

  async update(
    userId: string,
    playlistId: string,
    updateDto: UpdateSmartPlaylistDto,
  ) {
    const existing = await this.findOne(userId, playlistId);

    return this.prisma.smartPlaylist.update({
      data: {
        criteria: updateDto.criteria
          ? (updateDto.criteria as unknown as Prisma.JsonObject)
          : (existing.criteria as unknown as Prisma.JsonObject),
        description: updateDto.description ?? existing.description,
        isActive: updateDto.isActive ?? existing.isActive,
        lastUpdated: new Date(),
        name: updateDto.name ?? existing.name,
      },
      where: { id: playlistId },
    });
  }

  private buildDateCondition(
    field: string,
    rule: PlaylistRuleDto,
  ): Prisma.UserTrackWhereInput {
    if (rule.operator === PlaylistRuleOperator.IN_LAST && rule.daysValue) {
      const date = new Date();
      date.setDate(date.getDate() - rule.daysValue);
      return { [field]: { gte: date } };
    }

    if (rule.operator === PlaylistRuleOperator.NOT_IN_LAST && rule.daysValue) {
      const date = new Date();
      date.setDate(date.getDate() - rule.daysValue);
      return { [field]: { lt: date } };
    }

    return {};
  }

  private buildNumberCondition(
    field: string,
    rule: PlaylistRuleDto,
  ): Record<string, unknown> {
    switch (rule.operator) {
      case PlaylistRuleOperator.EQUALS: {
        const value = rule.numberValue ?? parseInt(rule.value);
        return { [field]: value };
      }
      case PlaylistRuleOperator.GREATER_THAN:
        return { [field]: { gt: rule.numberValue ?? parseInt(rule.value) } };
      case PlaylistRuleOperator.IS_NOT_NULL:
        return { [field]: { not: null } };
      case PlaylistRuleOperator.IS_NULL:
        return { [field]: null };
      case PlaylistRuleOperator.LESS_THAN:
        return { [field]: { lt: rule.numberValue ?? parseInt(rule.value) } };
      case PlaylistRuleOperator.NOT_EQUALS:
        return { [field]: { not: rule.numberValue ?? parseInt(rule.value) } };
      default:
        return {};
    }
  }

  private buildOrderBy(
    criteria: PlaylistCriteriaDto,
  ): Prisma.UserTrackOrderByWithRelationInput {
    if (!criteria.orderBy) {
      return { addedAt: 'desc' };
    }

    const direction = criteria.orderDirection || 'desc';
    return this.buildOrderByClause(criteria.orderBy, direction);
  }

  /**
   * Builds a Prisma orderBy clause based on field name and direction.
   * Handles field name normalization for both API and criteria formats.
   */
  private buildOrderByClause(
    field: string,
    direction: 'asc' | 'desc',
  ): Prisma.UserTrackOrderByWithRelationInput {
    // Normalize field names from criteria format to database field format
    const normalizedField = this.normalizeFieldName(field);

    switch (normalizedField) {
      case 'addedAt':
        return { addedAt: direction };
      case 'album':
        return { spotifyTrack: { album: { name: direction } } };
      case 'artist':
        return { spotifyTrack: { artist: { name: direction } } };
      case 'duration':
        return { spotifyTrack: { duration: direction } };
      case 'lastPlayedAt':
        return { lastPlayedAt: direction };
      case 'rating':
        return { rating: direction };
      case 'title':
        return { spotifyTrack: { title: direction } };
      case 'totalPlayCount':
        return { totalPlayCount: direction };
      default:
        return { addedAt: 'desc' };
    }
  }

  private buildRuleCondition(
    rule: PlaylistRuleDto,
  ): Prisma.UserTrackWhereInput {
    switch (rule.field) {
      case PlaylistRuleField.ALBUM:
        return this.buildStringCondition(
          'spotifyTrack.album',
          rule,
        ) as Prisma.UserTrackWhereInput;

      case PlaylistRuleField.ARTIST:
        return this.buildStringCondition(
          'spotifyTrack.artist',
          rule,
        ) as Prisma.UserTrackWhereInput;

      case PlaylistRuleField.DATE_ADDED:
        return this.buildDateCondition('addedAt', rule);

      case PlaylistRuleField.DURATION:
        return {
          spotifyTrack: this.buildNumberCondition('duration', rule),
        };

      case PlaylistRuleField.LAST_PLAYED:
        return this.buildDateCondition('lastPlayedAt', rule);

      case PlaylistRuleField.PLAY_COUNT:
        return this.buildNumberCondition(
          'totalPlayCount',
          rule,
        ) as Prisma.UserTrackWhereInput;

      case PlaylistRuleField.RATING:
        return this.buildNumberCondition(
          'rating',
          rule,
        ) as Prisma.UserTrackWhereInput;

      case PlaylistRuleField.TAG:
        return this.buildTagCondition(rule);

      case PlaylistRuleField.TITLE:
        return this.buildStringCondition(
          'spotifyTrack.title',
          rule,
        ) as Prisma.UserTrackWhereInput;

      default:
        return {};
    }
  }

  private buildStringCondition(
    field: string,
    rule: PlaylistRuleDto,
  ): Prisma.SpotifyTrackWhereInput | Prisma.UserTrackWhereInput {
    const [parent, child] = field.split('.');
    const condition: Record<string, unknown> = {};

    switch (rule.operator) {
      case PlaylistRuleOperator.CONTAINS:
        condition[child || parent] = {
          contains: rule.value,
          mode: 'insensitive',
        };
        break;
      case PlaylistRuleOperator.ENDS_WITH:
        condition[child || parent] = {
          endsWith: rule.value,
          mode: 'insensitive',
        };
        break;
      case PlaylistRuleOperator.EQUALS:
        condition[child || parent] = rule.value;
        break;
      case PlaylistRuleOperator.NOT_CONTAINS:
        condition[child || parent] = {
          NOT: { contains: rule.value, mode: 'insensitive' },
        };
        break;
      case PlaylistRuleOperator.NOT_EQUALS:
        condition[child || parent] = { not: rule.value };
        break;
      case PlaylistRuleOperator.STARTS_WITH:
        condition[child || parent] = {
          mode: 'insensitive',
          startsWith: rule.value,
        };
        break;
    }

    return child ? { [parent]: condition } : condition;
  }

  private buildTagCondition(rule: PlaylistRuleDto): Prisma.UserTrackWhereInput {
    switch (rule.operator) {
      case PlaylistRuleOperator.HAS_ANY_TAG:
        return {
          tags: {
            some: {},
          },
        };

      case PlaylistRuleOperator.HAS_NO_TAGS:
        return {
          tags: {
            none: {},
          },
        };

      case PlaylistRuleOperator.HAS_TAG:
        return {
          tags: {
            some: {
              tag: {
                name: rule.value,
              },
            },
          },
        };

      case PlaylistRuleOperator.NOT_HAS_TAG:
        return {
          tags: {
            none: {
              tag: {
                name: rule.value,
              },
            },
          },
        };

      default:
        return {};
    }
  }

  private buildWhereClause(
    userId: string,
    criteria: PlaylistCriteriaDto,
  ): Prisma.UserTrackWhereInput {
    const baseWhere: Prisma.UserTrackWhereInput = { userId };

    if (!criteria.rules || criteria.rules.length === 0) {
      return baseWhere;
    }

    const ruleConditions = criteria.rules.map((rule) =>
      this.buildRuleCondition(rule),
    );

    if (criteria.logic === 'or') {
      return {
        ...baseWhere,
        OR: ruleConditions,
      };
    } else {
      return {
        ...baseWhere,
        AND: ruleConditions,
      };
    }
  }

  private async getTrackCount(
    userId: string,
    criteria: PlaylistCriteriaDto,
  ): Promise<number> {
    const where = this.buildWhereClause(userId, criteria);
    const count = await this.prisma.userTrack.count({ where });
    return criteria.limit ? Math.min(count, criteria.limit) : count;
  }

  /**
   * Normalizes field names from criteria format to database field format.
   * Maps: dateAdded -> addedAt, playCount -> totalPlayCount, lastPlayed -> lastPlayedAt
   */
  private normalizeFieldName(field: string): string {
    const fieldMap: Record<string, string> = {
      dateAdded: 'addedAt',
      lastPlayed: 'lastPlayedAt',
      playCount: 'totalPlayCount',
    };

    return fieldMap[field] || field;
  }
}
