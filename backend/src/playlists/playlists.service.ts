import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AuthService } from "../auth/auth.service";
import { hashTrackIds } from "../common/utils/playlist-hash.util";
import { DatabaseService } from "../database/database.service";
import { SpotifyService } from "../library/spotify.service";
import { TrackService } from "../library/track.service";
import { PlaylistCriteriaDto } from "./dto/playlist-criteria.dto";
import {
  PlaylistRuleDto,
  PlaylistRuleField,
  PlaylistRuleOperator,
} from "./dto/playlist-rule.dto";
import {
  CreateSmartPlaylistDto,
  UpdateSmartPlaylistDto,
} from "./dto/smart-playlist.dto";

const SPOTIFY_PLAYLIST_PREFIX = "[Codex.fm]";

@Injectable()
export class PlaylistsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly trackService: TrackService,
    private readonly spotifyService: SpotifyService,
    private readonly authService: AuthService,
  ) {}

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
      orderBy: { createdAt: "desc" },
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
      throw new NotFoundException("Playlist not found");
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

  /**
   * Get track IDs matching a playlist's criteria (for sync purposes)
   */
  async getTrackIdsForSync(
    userId: string,
    criteria: PlaylistCriteriaDto,
  ): Promise<string[]> {
    const where = this.buildWhereClause(userId, criteria);
    const orderBy = this.buildOrderBy(criteria);

    const maxTracks = criteria.limit || 10000;
    const tracks = await this.prisma.userTrack.findMany({
      orderBy,
      select: { spotifyTrack: { select: { spotifyId: true } } },
      take: maxTracks,
      where,
    });

    return tracks.map((t) => t.spotifyTrack.spotifyId);
  }

  async getTracks(
    userId: string,
    playlistId: string,
    page = 1,
    pageSize = 20,
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ) {
    const playlist = await this.findOne(userId, playlistId);
    const criteria = playlist.criteria as unknown as PlaylistCriteriaDto;

    const where = this.buildWhereClause(userId, criteria);
    const orderBy = sortBy
      ? this.buildOrderByClause(sortBy, sortOrder || "desc")
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
            include: { album: { include: { artist: true } }, artist: true },
          },
          tags: { include: { tag: true } },
        },
        orderBy,
        skip,
        take,
        where,
      }),
      this.prisma.userTrack.count({ where }),
    ]);

    const formattedTracks = tracks.map((track) => ({
      acousticness: track.spotifyTrack.acousticness ?? undefined,
      addedAt: track.addedAt,
      album: track.spotifyTrack.album.name,
      albumArt: track.spotifyTrack.album.imageUrl || null,
      albumId: track.spotifyTrack.albumId,
      artist: track.spotifyTrack.artist.name,
      artistGenres: [],
      artistId: track.spotifyTrack.artistId,
      danceability: track.spotifyTrack.danceability ?? undefined,
      duration: track.spotifyTrack.duration,
      energy: track.spotifyTrack.energy ?? undefined,
      id: track.id,
      instrumentalness: track.spotifyTrack.instrumentalness ?? undefined,
      lastPlayedAt: track.lastPlayedAt || null,
      liveness: track.spotifyTrack.liveness ?? undefined,
      ratedAt: track.ratedAt || null,
      rating: track.rating || null,
      sources: track.sources.map((s) => ({
        createdAt: s.createdAt,
        id: s.id,
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        sourceType: s.sourceType,
      })),
      speechiness: track.spotifyTrack.speechiness ?? undefined,
      spotifyId: track.spotifyTrack.spotifyId,
      tags: track.tags.map((tt) => ({
        color: tt.tag.color,
        id: tt.tag.id,
        name: tt.tag.name,
      })),
      tempo: track.spotifyTrack.tempo ?? undefined,
      title: track.spotifyTrack.title,
      totalPlayCount: track.totalPlayCount,
      valence: track.spotifyTrack.valence ?? undefined,
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
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ): Promise<string[]> {
    const playlist = await this.findOne(userId, playlistId);
    const criteria = playlist.criteria as unknown as PlaylistCriteriaDto;

    const where = this.buildWhereClause(userId, criteria);
    const orderBy = sortBy
      ? this.buildOrderByClause(sortBy, sortOrder || "desc")
      : this.buildOrderBy(criteria);

    // Get all tracks up to playlist limit (or 500 max for Spotify API compatibility)
    const maxTracks = criteria.limit ? Math.min(criteria.limit, 500) : 500;

    // Use TrackService helper to fetch and optionally shuffle tracks
    return this.trackService.fetchTracksForPlay(
      userId,
      where,
      orderBy,
      maxTracks,
      shuffle,
    );
  }

  async remove(userId: string, playlistId: string) {
    await this.findOne(userId, playlistId); // Check ownership
    await this.prisma.smartPlaylist.delete({ where: { id: playlistId } });
  }

  async syncToSpotify(
    userId: string,
    playlistId: string,
  ): Promise<{ spotifyPlaylistId: string; trackCount: number }> {
    // Get user and verify they have Spotify connected
    const user = await this.prisma.user.findUnique({
      select: { id: true, spotifyId: true },
      where: { id: userId },
    });

    if (!user?.spotifyId) {
      throw new UnauthorizedException("Spotify account not connected");
    }

    // Get valid access token (handles refresh if needed)
    const accessToken = await this.authService.getSpotifyAccessToken(userId);
    if (!accessToken) {
      throw new UnauthorizedException("Unable to get Spotify access token");
    }

    // Get the playlist
    const playlist = await this.findOne(userId, playlistId);

    // Get all track URIs for this playlist (no limit for sync)
    const criteria = playlist.criteria as unknown as PlaylistCriteriaDto;
    const where = this.buildWhereClause(userId, criteria);
    const orderBy = this.buildOrderBy(criteria);

    // Get tracks - no 500 limit for sync, but respect playlist's own limit
    const maxTracks = criteria.limit || 10000;
    const tracks = await this.prisma.userTrack.findMany({
      include: { spotifyTrack: true },
      orderBy,
      take: maxTracks,
      where,
    });

    const trackUris = tracks.map(
      (track) => `spotify:track:${track.spotifyTrack.spotifyId}`,
    );

    // Calculate hash of track IDs for change detection
    const trackIds = tracks.map((t) => t.spotifyTrack.spotifyId);
    const trackIdsHash = hashTrackIds(trackIds);

    const spotifyPlaylistName = `${SPOTIFY_PLAYLIST_PREFIX} ${playlist.name}`;
    const description =
      playlist.description || `Smart playlist synced from Codex.fm`;

    let spotifyPlaylistId = playlist.spotifyPlaylistId;

    if (spotifyPlaylistId) {
      // Update existing playlist
      await this.spotifyService.updatePlaylistDetails(
        accessToken,
        spotifyPlaylistId,
        spotifyPlaylistName,
        description,
      );

      // Replace tracks
      await this.spotifyService.replacePlaylistTracks(
        accessToken,
        spotifyPlaylistId,
        trackUris,
      );
    } else {
      // Create new playlist
      const result = await this.spotifyService.createPlaylist(
        accessToken,
        user.spotifyId,
        spotifyPlaylistName,
        description,
      );

      spotifyPlaylistId = result.id;

      // Add tracks to the new playlist
      if (trackUris.length > 0) {
        await this.spotifyService.replacePlaylistTracks(
          accessToken,
          spotifyPlaylistId,
          trackUris,
        );
      }

      // Save the Spotify playlist ID to our database
      await this.prisma.smartPlaylist.update({
        data: { spotifyPlaylistId },
        where: { id: playlistId },
      });
    }

    // Update lastSyncedAt and trackIdsHash
    await this.prisma.smartPlaylist.update({
      data: { lastSyncedAt: new Date(), trackIdsHash },
      where: { id: playlistId },
    });

    return { spotifyPlaylistId, trackCount: trackUris.length };
  }

  async update(
    userId: string,
    playlistId: string,
    updateDto: UpdateSmartPlaylistDto,
  ) {
    const existing = await this.findOne(userId, playlistId);

    // Get the raw playlist to access autoSync
    const rawPlaylist = await this.prisma.smartPlaylist.findUnique({
      select: { autoSync: true },
      where: { id: playlistId },
    });

    return this.prisma.smartPlaylist.update({
      data: {
        autoSync: updateDto.autoSync ?? rawPlaylist?.autoSync ?? true,
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

  private buildFloatCondition(
    field: string,
    rule: PlaylistRuleDto,
  ): Record<string, unknown> {
    // Parse float value from either numberValue or string value
    // Returns undefined for NaN or non-finite values
    const getValue = (): number | undefined => {
      if (rule.numberValue !== undefined && Number.isFinite(rule.numberValue)) {
        return rule.numberValue;
      }
      if (rule.value !== undefined) {
        const parsed = parseFloat(rule.value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    switch (rule.operator) {
      case PlaylistRuleOperator.EQUALS: {
        const value = getValue();
        return value !== undefined ? { [field]: value } : {};
      }
      case PlaylistRuleOperator.GREATER_THAN: {
        const value = getValue();
        return value !== undefined ? { [field]: { gt: value } } : {};
      }
      case PlaylistRuleOperator.IS_NOT_NULL:
        return { [field]: { not: null } };
      case PlaylistRuleOperator.IS_NULL:
        return { [field]: null };
      case PlaylistRuleOperator.LESS_THAN: {
        const value = getValue();
        return value !== undefined ? { [field]: { lt: value } } : {};
      }
      case PlaylistRuleOperator.NOT_EQUALS: {
        const value = getValue();
        return value !== undefined ? { [field]: { not: value } } : {};
      }
      default:
        return {};
    }
  }

  private buildGenreCondition(
    rule: PlaylistRuleDto,
  ): Prisma.UserTrackWhereInput {
    const normalizedGenre = rule.value?.toLowerCase();

    switch (rule.operator) {
      case PlaylistRuleOperator.HAS_ANY_TAG:
        return { spotifyTrack: { genres: { some: {} } } };

      case PlaylistRuleOperator.HAS_NO_TAGS:
        return { spotifyTrack: { genres: { none: {} } } };

      case PlaylistRuleOperator.HAS_TAG:
        return {
          spotifyTrack: {
            genres: { some: { genre: { name: normalizedGenre } } },
          },
        };

      case PlaylistRuleOperator.NOT_HAS_TAG:
        return {
          spotifyTrack: {
            genres: { none: { genre: { name: normalizedGenre } } },
          },
        };

      default:
        return {};
    }
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
  ): Prisma.UserTrackOrderByWithRelationInput[] {
    if (!criteria.orderBy) {
      return [{ addedAt: "desc" }, { id: "asc" }];
    }

    const direction = criteria.orderDirection || "desc";
    return this.buildOrderByClause(criteria.orderBy, direction);
  }

  /**
   * Builds a Prisma orderBy clause based on field name and direction.
   * Handles field name normalization for both API and criteria formats.
   * Returns an array with secondary sort by id for deterministic ordering.
   */
  private buildOrderByClause(
    field: string,
    direction: "asc" | "desc",
  ): Prisma.UserTrackOrderByWithRelationInput[] {
    // Normalize field names from criteria format to database field format
    const normalizedField = this.normalizeFieldName(field);

    // Secondary sort by id ensures deterministic ordering when primary sort has ties
    const secondarySort: Prisma.UserTrackOrderByWithRelationInput = {
      id: "asc",
    };

    // For nullable fields, use nulls: 'last' to push NULL values to the end
    const nullsLast = { nulls: "last" as const, sort: direction };

    switch (normalizedField) {
      // Audio features - nullable, use NULLS LAST
      case "acousticness":
        return [{ spotifyTrack: { acousticness: nullsLast } }, secondarySort];
      // Non-nullable fields - direct ordering
      case "addedAt":
        return [{ addedAt: direction }, secondarySort];
      case "album":
        return [
          { spotifyTrack: { album: { name: direction } } },
          secondarySort,
        ];
      case "artist":
        return [
          { spotifyTrack: { artist: { name: direction } } },
          secondarySort,
        ];
      case "danceability":
        return [{ spotifyTrack: { danceability: nullsLast } }, secondarySort];
      case "duration":
        return [{ spotifyTrack: { duration: direction } }, secondarySort];
      case "energy":
        return [{ spotifyTrack: { energy: nullsLast } }, secondarySort];
      case "instrumentalness":
        return [
          { spotifyTrack: { instrumentalness: nullsLast } },
          secondarySort,
        ];
      // Other nullable fields
      case "lastPlayedAt":
        return [{ lastPlayedAt: nullsLast }, secondarySort];
      case "liveness":
        return [{ spotifyTrack: { liveness: nullsLast } }, secondarySort];
      case "rating":
        return [{ rating: nullsLast }, secondarySort];
      case "speechiness":
        return [{ spotifyTrack: { speechiness: nullsLast } }, secondarySort];
      case "tempo":
        return [{ spotifyTrack: { tempo: nullsLast } }, secondarySort];
      case "title":
        return [{ spotifyTrack: { title: direction } }, secondarySort];
      case "totalPlayCount":
        return [{ totalPlayCount: direction }, secondarySort];
      case "valence":
        return [{ spotifyTrack: { valence: nullsLast } }, secondarySort];
      default:
        return [{ addedAt: "desc" }, secondarySort];
    }
  }

  private buildRelationStringCondition(
    parent: string,
    relation: string,
    field: string,
    rule: PlaylistRuleDto,
  ): Prisma.UserTrackWhereInput {
    // Guard: string operators require a value
    if (rule.value === undefined || rule.value === null) {
      return {};
    }

    // For NOT_CONTAINS and NOT_EQUALS, we use NOT at the top level.
    // Note: Prisma v6.3.1+ supports mode: "insensitive" inside nested `not` blocks
    // for PostgreSQL and MongoDB. However, using top-level NOT will also match
    // records where the relation is NULL. For our use case this is acceptable
    // since all tracks have required artist/album relations.
    if (rule.operator === PlaylistRuleOperator.NOT_CONTAINS) {
      return {
        NOT: {
          [parent]: {
            [relation]: {
              [field]: { contains: rule.value, mode: "insensitive" },
            },
          },
        },
      };
    }

    if (rule.operator === PlaylistRuleOperator.NOT_EQUALS) {
      return {
        NOT: {
          [parent]: {
            [relation]: {
              [field]: { equals: rule.value, mode: "insensitive" },
            },
          },
        },
      };
    }

    let fieldCondition: Record<string, unknown>;

    switch (rule.operator) {
      case PlaylistRuleOperator.CONTAINS:
        fieldCondition = { contains: rule.value, mode: "insensitive" };
        break;
      case PlaylistRuleOperator.ENDS_WITH:
        fieldCondition = { endsWith: rule.value, mode: "insensitive" };
        break;
      case PlaylistRuleOperator.EQUALS:
        fieldCondition = { equals: rule.value, mode: "insensitive" };
        break;
      case PlaylistRuleOperator.STARTS_WITH:
        fieldCondition = { mode: "insensitive", startsWith: rule.value };
        break;
      default:
        return {};
    }

    // Build nested structure: { spotifyTrack: { artist: { name: { contains: ... } } } }
    return { [parent]: { [relation]: { [field]: fieldCondition } } };
  }

  private buildRuleCondition(
    rule: PlaylistRuleDto,
  ): Prisma.UserTrackWhereInput {
    switch (rule.field) {
      // Audio feature fields (stored on SpotifyTrack)
      case PlaylistRuleField.ACOUSTICNESS:
        return { spotifyTrack: this.buildFloatCondition("acousticness", rule) };

      case PlaylistRuleField.ALBUM:
        return this.buildRelationStringCondition(
          "spotifyTrack",
          "album",
          "name",
          rule,
        );

      case PlaylistRuleField.ARTIST:
        return this.buildRelationStringCondition(
          "spotifyTrack",
          "artist",
          "name",
          rule,
        );

      case PlaylistRuleField.DANCEABILITY:
        return { spotifyTrack: this.buildFloatCondition("danceability", rule) };

      case PlaylistRuleField.DATE_ADDED:
        return this.buildDateCondition("addedAt", rule);

      case PlaylistRuleField.DURATION:
        return { spotifyTrack: this.buildNumberCondition("duration", rule) };

      case PlaylistRuleField.ENERGY:
        return { spotifyTrack: this.buildFloatCondition("energy", rule) };

      case PlaylistRuleField.GENRE:
        return this.buildGenreCondition(rule);

      case PlaylistRuleField.INSTRUMENTALNESS:
        return {
          spotifyTrack: this.buildFloatCondition("instrumentalness", rule),
        };

      case PlaylistRuleField.LAST_PLAYED:
        return this.buildDateCondition("lastPlayedAt", rule);

      case PlaylistRuleField.LIVENESS:
        return { spotifyTrack: this.buildFloatCondition("liveness", rule) };

      case PlaylistRuleField.PLAY_COUNT:
        return this.buildNumberCondition(
          "totalPlayCount",
          rule,
        ) as Prisma.UserTrackWhereInput;

      case PlaylistRuleField.RATING:
        return this.buildNumberCondition(
          "rating",
          rule,
        ) as Prisma.UserTrackWhereInput;

      case PlaylistRuleField.SPEECHINESS:
        return { spotifyTrack: this.buildFloatCondition("speechiness", rule) };

      case PlaylistRuleField.TAG:
        return this.buildTagCondition(rule);

      case PlaylistRuleField.TEMPO:
        return { spotifyTrack: this.buildFloatCondition("tempo", rule) };

      case PlaylistRuleField.TITLE:
        return this.buildStringCondition(
          "spotifyTrack.title",
          rule,
        ) as Prisma.UserTrackWhereInput;

      case PlaylistRuleField.VALENCE:
        return { spotifyTrack: this.buildFloatCondition("valence", rule) };

      default:
        return {};
    }
  }

  private buildStringCondition(
    field: string,
    rule: PlaylistRuleDto,
  ): Prisma.SpotifyTrackWhereInput | Prisma.UserTrackWhereInput {
    // Guard: string operators require a value
    if (rule.value === undefined || rule.value === null) {
      return {};
    }

    const [parent, child] = field.split(".");

    // For NOT_CONTAINS and NOT_EQUALS, we use NOT at the top level.
    // Note: Prisma v6.3.1+ supports mode: "insensitive" inside nested `not` blocks
    // for PostgreSQL and MongoDB. However, using top-level NOT will also match
    // records where the relation is NULL. For our use case this is acceptable
    // since spotifyTrack is a required relation on UserTrack.
    if (rule.operator === PlaylistRuleOperator.NOT_CONTAINS) {
      if (child) {
        return {
          NOT: {
            [parent]: {
              [child]: { contains: rule.value, mode: "insensitive" },
            },
          },
        };
      }
      return {
        NOT: { [parent]: { contains: rule.value, mode: "insensitive" } },
      };
    }

    if (rule.operator === PlaylistRuleOperator.NOT_EQUALS) {
      if (child) {
        return {
          NOT: {
            [parent]: { [child]: { equals: rule.value, mode: "insensitive" } },
          },
        };
      }
      return { NOT: { [parent]: { equals: rule.value, mode: "insensitive" } } };
    }

    const condition: Record<string, unknown> = {};

    switch (rule.operator) {
      case PlaylistRuleOperator.CONTAINS:
        condition[child || parent] = {
          contains: rule.value,
          mode: "insensitive",
        };
        break;
      case PlaylistRuleOperator.ENDS_WITH:
        condition[child || parent] = {
          endsWith: rule.value,
          mode: "insensitive",
        };
        break;
      case PlaylistRuleOperator.EQUALS:
        condition[child || parent] = {
          equals: rule.value,
          mode: "insensitive",
        };
        break;
      case PlaylistRuleOperator.STARTS_WITH:
        condition[child || parent] = {
          mode: "insensitive",
          startsWith: rule.value,
        };
        break;
    }

    return child ? { [parent]: condition } : condition;
  }

  private buildTagCondition(rule: PlaylistRuleDto): Prisma.UserTrackWhereInput {
    switch (rule.operator) {
      case PlaylistRuleOperator.HAS_ANY_TAG:
        return { tags: { some: {} } };

      case PlaylistRuleOperator.HAS_NO_TAGS:
        return { tags: { none: {} } };

      case PlaylistRuleOperator.HAS_TAG:
        return { tags: { some: { tag: { name: rule.value } } } };

      case PlaylistRuleOperator.NOT_HAS_TAG:
        return { tags: { none: { tag: { name: rule.value } } } };

      default:
        return {};
    }
  }

  private buildWhereClause(
    userId: string,
    criteria: PlaylistCriteriaDto,
  ): Prisma.UserTrackWhereInput {
    const baseWhere: Prisma.UserTrackWhereInput = {
      addedToLibrary: true,
      userId,
    };

    if (!criteria.rules || criteria.rules.length === 0) {
      return baseWhere;
    }

    const ruleConditions = criteria.rules.map((rule) =>
      this.buildRuleCondition(rule),
    );

    if (criteria.logic === "or") {
      return { ...baseWhere, OR: ruleConditions };
    } else {
      return { ...baseWhere, AND: ruleConditions };
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
      dateAdded: "addedAt",
      lastPlayed: "lastPlayedAt",
      playCount: "totalPlayCount",
    };

    return fieldMap[field] || field;
  }
}
