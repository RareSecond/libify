import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SourceType } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { sql } from "kysely";

import { DatabaseService } from "../database/database.service";
import { KyselyService } from "../database/kysely/kysely.service";
import { AggregationService } from "./aggregation.service";
import { AlbumDto, PaginatedAlbumsDto } from "./dto/album.dto";
import { ArtistDto, PaginatedArtistsDto } from "./dto/artist.dto";
import {
  BulkOperationFilterDto,
  BulkOperationResponseDto,
  BulkRatingRequestDto,
  BulkTagRequestDto,
} from "./dto/bulk-operations.dto";
import {
  GetPlayHistoryQueryDto,
  PaginatedPlayHistoryDto,
  PlayHistoryItemDto,
} from "./dto/play-history.dto";
import { PlaylistTracksResponseDto } from "./dto/playlist-tracks.dto";
import { PaginatedPlaylistsDto, PlaylistDto } from "./dto/playlist.dto";
import {
  GetTracksQueryDto,
  PaginatedTracksDto,
  TrackDto,
} from "./dto/track.dto";

// Interfaces removed - using direct database queries with UserAlbum and UserArtist models

@Injectable()
export class TrackService {
  private static readonly PLAY_HISTORY_SOURCE_NAME = "Play History";
  private readonly logger = new Logger(TrackService.name);

  constructor(
    private databaseService: DatabaseService,
    private kyselyService: KyselyService,
    private aggregationService: AggregationService,
  ) {}

  async addTrackToLibrary(userId: string, trackId: string): Promise<void> {
    const track = await this.databaseService.userTrack.findFirst({
      where: { id: trackId, userId },
    });

    if (!track) {
      throw new Error("Track not found");
    }

    if (track.addedToLibrary) {
      // Track is already in the library
      return;
    }

    await this.databaseService.userTrack.update({
      data: { addedToLibrary: true },
      where: { id: trackId },
    });

    // Add source tracking for play history
    await this.ensureTrackSource(
      trackId,
      SourceType.PLAY_HISTORY,
      TrackService.PLAY_HISTORY_SOURCE_NAME,
    );
  }

  /**
   * Bulk add tag to tracks
   * Skips tracks that already have the tag
   */
  async bulkAddTagToTracks(
    userId: string,
    request: BulkTagRequestDto,
  ): Promise<BulkOperationResponseDto> {
    const db = this.kyselyService.database;

    // Verify tag belongs to user
    const tag = await this.databaseService.tag.findFirst({
      where: { id: request.tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException("Tag not found");
    }

    // Get track IDs to tag
    const trackIds = await this.resolveTrackIds(userId, request);

    if (trackIds.length === 0) {
      return { affectedCount: 0, message: "No tracks matched the criteria" };
    }

    // Get tracks that already have this tag
    const existingTags = await db
      .selectFrom("TrackTag")
      .select("userTrackId")
      .where("tagId", "=", request.tagId)
      .where("userTrackId", "in", trackIds)
      .execute();

    const existingTrackIds = new Set(existingTags.map((t) => t.userTrackId));
    const newTrackIds = trackIds.filter((id) => !existingTrackIds.has(id));

    if (newTrackIds.length === 0) {
      return { affectedCount: 0, message: "All tracks already have this tag" };
    }

    // Insert new tag associations
    await db
      .insertInto("TrackTag")
      .values(
        newTrackIds.map((trackId) => ({
          createdAt: sql`NOW()`,
          tagId: request.tagId,
          userTrackId: trackId,
        })),
      )
      .execute();

    return {
      affectedCount: newTrackIds.length,
      message: `Added tag to ${newTrackIds.length} tracks`,
    };
  }

  /**
   * Bulk rate tracks
   * Can optionally overwrite existing ratings
   */
  async bulkRateTracks(
    userId: string,
    request: BulkRatingRequestDto,
  ): Promise<BulkOperationResponseDto> {
    const db = this.kyselyService.database;

    // Get track IDs to rate
    const trackIds = await this.resolveTrackIds(userId, request);

    if (trackIds.length === 0) {
      return { affectedCount: 0, message: "No tracks matched the criteria" };
    }

    // Build update query
    let query = db
      .updateTable("UserTrack")
      .set({ ratedAt: sql`NOW()`, rating: request.rating })
      .where("userId", "=", userId)
      .where("id", "in", trackIds);

    // If not overwriting, only rate unrated tracks
    if (!request.overwriteExisting) {
      query = query.where("rating", "is", null);
    }

    const result = await query.executeTakeFirst();
    const affectedCount = Number(result?.numUpdatedRows ?? 0);

    // Get unique album/artist IDs from affected tracks for aggregation
    if (affectedCount > 0) {
      const affectedTracks = await db
        .selectFrom("UserTrack as ut")
        .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
        .select(["st.albumId", "st.artistId"])
        .where("ut.id", "in", trackIds)
        .where("ut.userId", "=", userId)
        .execute();

      const uniqueAlbumIds = [...new Set(affectedTracks.map((t) => t.albumId))];
      const uniqueArtistIds = [
        ...new Set(affectedTracks.map((t) => t.artistId)),
      ];

      // Update aggregations in parallel
      await Promise.all([
        ...uniqueAlbumIds.map((id) =>
          this.aggregationService.updateUserAlbumStats(userId, id),
        ),
        ...uniqueArtistIds.map((id) =>
          this.aggregationService.updateUserArtistStats(userId, id),
        ),
      ]);
    }

    return {
      affectedCount,
      message: `Successfully rated ${affectedCount} tracks`,
    };
  }

  /**
   * Helper method to fetch tracks for playback with random order
   * Used when shuffle is true to get truly random tracks
   * Converts Prisma where clause to Kysely for efficient database-level randomization
   */

  /**
   * Bulk remove tag from tracks
   */
  async bulkRemoveTagFromTracks(
    userId: string,
    request: BulkTagRequestDto,
  ): Promise<BulkOperationResponseDto> {
    const db = this.kyselyService.database;

    // Verify tag belongs to user
    const tag = await this.databaseService.tag.findFirst({
      where: { id: request.tagId, userId },
    });

    if (!tag) {
      throw new NotFoundException("Tag not found");
    }

    // Get track IDs
    const trackIds = await this.resolveTrackIds(userId, request);

    if (trackIds.length === 0) {
      return { affectedCount: 0, message: "No tracks matched the criteria" };
    }

    // Delete tag associations
    const result = await db
      .deleteFrom("TrackTag")
      .where("tagId", "=", request.tagId)
      .where("userTrackId", "in", trackIds)
      .executeTakeFirst();

    const affectedCount = Number(result?.numDeletedRows ?? 0);

    return {
      affectedCount,
      message: `Removed tag from ${affectedCount} tracks`,
    };
  }

  /**
   * Helper method to fetch tracks for playback - used by both library and playlist endpoints
   */
  async fetchTracksForPlay(
    userId: string,
    where: Prisma.UserTrackWhereInput,
    orderBy:
      | Prisma.UserTrackOrderByWithRelationInput
      | Prisma.UserTrackOrderByWithRelationInput[],
    maxTracks: number,
    shuffle: boolean,
    skip = 0,
  ): Promise<string[]> {
    // If shuffling, use random order regardless of provided orderBy
    if (shuffle) {
      return this.fetchTracksForPlayWithRandomOrder(userId, where, maxTracks);
    }

    // Non-shuffle: use provided orderBy
    const tracks = await this.databaseService.userTrack.findMany({
      include: { spotifyTrack: { select: { spotifyId: true } } },
      orderBy,
      skip,
      take: maxTracks,
      where: { ...where, userId },
    });

    const spotifyUris = tracks
      .filter((track) => track.spotifyTrack.spotifyId)
      .map((track) => `spotify:track:${track.spotifyTrack.spotifyId}`);

    return spotifyUris;
  }

  /**
   * Helper method to fetch tracks for playback using Kysely with NULLS LAST support
   * Used for rating and lastPlayedAt sorts to ensure consistency with getUserTracksWithKysely
   */
  async fetchTracksForPlayWithKysely(
    userId: string,
    where: Prisma.UserTrackWhereInput,
    sortBy: "lastPlayedAt" | "rating",
    sortOrder: "asc" | "desc",
    maxTracks: number,
    shuffle: boolean,
    skip = 0,
  ): Promise<string[]> {
    // If shuffling, use random order regardless of sortBy
    if (shuffle) {
      return this.fetchTracksForPlayWithRandomOrder(userId, where, maxTracks);
    }

    const db = this.kyselyService.database;

    // Build base query
    let query = db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .select("st.spotifyId")
      .where("ut.userId", "=", userId);

    // Apply search filter from where clause
    if (where.OR && Array.isArray(where.OR)) {
      const searchConditions = where.OR as Array<Record<string, unknown>>;
      // Extract search term from title condition
      const titleCondition = searchConditions.find((cond) => {
        const trackCond = cond as {
          spotifyTrack?: { title?: { contains?: string } };
        };
        return trackCond.spotifyTrack?.title?.contains;
      });
      if (titleCondition) {
        const trackCond = titleCondition as {
          spotifyTrack: { title: { contains: string } };
        };
        const searchTerm = trackCond.spotifyTrack.title.contains;
        query = query.where((eb) =>
          eb.or([
            eb("st.title", "ilike", `%${searchTerm}%`),
            eb(
              sql`EXISTS (
                SELECT 1 FROM "SpotifyArtist" sar
                WHERE sar.id = st."artistId"
                AND sar.name ILIKE ${`%${searchTerm}%`}
              )`,
              "=",
              sql`true`,
            ),
            eb(
              sql`EXISTS (
                SELECT 1 FROM "SpotifyAlbum" sa
                WHERE sa.id = st."albumId"
                AND sa.name ILIKE ${`%${searchTerm}%`}
              )`,
              "=",
              sql`true`,
            ),
          ]),
        );
      }
    }

    // Apply tag filter
    if (where.tags?.some) {
      const tagCondition = where.tags.some as { tagId?: { in?: string[] } };
      if (tagCondition.tagId?.in) {
        query = query
          .innerJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
          .where("tt.tagId", "in", tagCondition.tagId.in);
      }
    }

    // Apply rating filter
    if (where.rating === null) {
      // Filter for unrated tracks only
      query = query.where("ut.rating", "is", null);
    } else if (
      where.rating &&
      typeof where.rating === "object" &&
      "gte" in where.rating
    ) {
      const minRating = where.rating.gte as number;
      query = query.where("ut.rating", ">=", minRating);
    }

    // Apply source type filter
    if (where.sources?.some) {
      const sourceCondition = where.sources.some as {
        sourceType?: { in?: string[] };
      };
      if (
        sourceCondition.sourceType?.in &&
        sourceCondition.sourceType.in.length > 0
      ) {
        const sourceTypes = sourceCondition.sourceType.in as SourceType[];
        query = query
          .innerJoin("TrackSource as ts", "ut.id", "ts.userTrackId")
          .where("ts.sourceType", "in", sourceTypes);
      }
    }

    // Apply genre filter
    if (where.spotifyTrack?.artist?.genres?.hasSome) {
      const genres = where.spotifyTrack.artist.genres.hasSome as string[];
      query = query.where(({ eb }) =>
        eb(
          sql`EXISTS (
            SELECT 1 FROM "SpotifyArtist" sar
            WHERE sar.id = st."artistId"
            AND sar.genres && ARRAY[${sql.join(genres.map((g) => sql.lit(g)))}]::text[]
          )`,
          "=",
          sql`true`,
        ),
      );
    }

    // Apply date filters (addedAt, lastPlayedAt)
    if (where.addedAt) {
      const dateFilter = where.addedAt as {
        equals?: Date;
        gt?: Date;
        gte?: Date;
        lt?: Date;
        lte?: Date;
      };
      if (dateFilter.gte) {
        query = query.where("ut.addedAt", ">=", dateFilter.gte);
      }
      if (dateFilter.lte) {
        query = query.where("ut.addedAt", "<=", dateFilter.lte);
      }
      if (dateFilter.gt) {
        query = query.where("ut.addedAt", ">", dateFilter.gt);
      }
      if (dateFilter.lt) {
        query = query.where("ut.addedAt", "<", dateFilter.lt);
      }
      if (dateFilter.equals) {
        query = query.where("ut.addedAt", "=", dateFilter.equals);
      }
    }

    if (where.lastPlayedAt) {
      const dateFilter = where.lastPlayedAt as {
        equals?: Date;
        gt?: Date;
        gte?: Date;
        lt?: Date;
        lte?: Date;
      };
      if (dateFilter.gte) {
        query = query.where("ut.lastPlayedAt", ">=", dateFilter.gte);
      }
      if (dateFilter.lte) {
        query = query.where("ut.lastPlayedAt", "<=", dateFilter.lte);
      }
      if (dateFilter.gt) {
        query = query.where("ut.lastPlayedAt", ">", dateFilter.gt);
      }
      if (dateFilter.lt) {
        query = query.where("ut.lastPlayedAt", "<", dateFilter.lt);
      }
      if (dateFilter.equals) {
        query = query.where("ut.lastPlayedAt", "=", dateFilter.equals);
      }
    }

    // Apply number filters (totalPlayCount, duration)
    if (where.totalPlayCount) {
      const numberFilter = where.totalPlayCount as {
        equals?: number;
        gt?: number;
        gte?: number;
        lt?: number;
        lte?: number;
      };
      if (numberFilter.gte) {
        query = query.where("ut.totalPlayCount", ">=", numberFilter.gte);
      }
      if (numberFilter.lte) {
        query = query.where("ut.totalPlayCount", "<=", numberFilter.lte);
      }
      if (numberFilter.gt) {
        query = query.where("ut.totalPlayCount", ">", numberFilter.gt);
      }
      if (numberFilter.lt) {
        query = query.where("ut.totalPlayCount", "<", numberFilter.lt);
      }
      if (numberFilter.equals) {
        query = query.where("ut.totalPlayCount", "=", numberFilter.equals);
      }
    }

    if (where.spotifyTrack?.duration) {
      const numberFilter = where.spotifyTrack.duration as {
        equals?: number;
        gt?: number;
        gte?: number;
        lt?: number;
        lte?: number;
      };
      if (numberFilter.gte) {
        query = query.where("st.duration", ">=", numberFilter.gte);
      }
      if (numberFilter.lte) {
        query = query.where("st.duration", "<=", numberFilter.lte);
      }
      if (numberFilter.gt) {
        query = query.where("st.duration", ">", numberFilter.gt);
      }
      if (numberFilter.lt) {
        query = query.where("st.duration", "<", numberFilter.lt);
      }
      if (numberFilter.equals) {
        query = query.where("st.duration", "=", numberFilter.equals);
      }
    }

    // Apply ordering with NULLS LAST
    if (sortBy === "rating") {
      query = query
        .orderBy(
          sql`ut.rating ${sql.raw(sortOrder === "asc" ? "ASC" : "DESC")} NULLS LAST`,
        )
        .orderBy("ut.addedAt", "desc")
        .orderBy("ut.id", "asc");
    } else if (sortBy === "lastPlayedAt") {
      query = query
        .orderBy(
          sql`ut."lastPlayedAt" ${sql.raw(sortOrder === "asc" ? "ASC" : "DESC")} NULLS LAST`,
        )
        .orderBy("ut.id", "asc");
    }

    // Apply pagination (skip only applies to non-shuffle)
    query = query.offset(skip).limit(maxTracks);

    const tracks = await query.execute();

    const spotifyUris = tracks
      .filter((track) => track.spotifyId)
      .map((track) => `spotify:track:${track.spotifyId}`);

    this.logger.log(
      `First 5 track URIs after skip=${skip} (Kysely, sortBy=${sortBy}): ${spotifyUris.slice(0, 5).join(", ")}`,
    );

    return spotifyUris;
  }

  async fetchTracksForPlayWithRandomOrder(
    userId: string,
    where: Prisma.UserTrackWhereInput,
    maxTracks: number,
  ): Promise<string[]> {
    const db = this.kyselyService.database;

    // Build base query with proper randomization at DB level
    let query = db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .select("st.spotifyId")
      .where("ut.userId", "=", userId);

    // Apply addedToLibrary filter if present (always true for smart playlists)
    if (where.addedToLibrary === true) {
      query = query.where("ut.addedToLibrary", "=", true);
    }

    // Apply all filters inline with full type safety

    // Handle OR conditions (e.g., search across title/artist/album)
    if (where.OR && Array.isArray(where.OR)) {
      const hasSearchPattern = where.OR.some((cond) => {
        const trackCond = cond as {
          spotifyTrack?: {
            album?: { name?: { contains?: string } };
            artist?: { name?: { contains?: string } };
            title?: { contains?: string };
          };
        };
        return (
          trackCond.spotifyTrack?.title?.contains ||
          trackCond.spotifyTrack?.artist?.name?.contains ||
          trackCond.spotifyTrack?.album?.name?.contains
        );
      });

      if (hasSearchPattern) {
        // Extract search term
        let searchTerm = "";
        for (const cond of where.OR) {
          const trackCond = cond as {
            spotifyTrack?: {
              album?: { name?: { contains?: string } };
              artist?: { name?: { contains?: string } };
              title?: { contains?: string };
            };
          };
          searchTerm =
            trackCond.spotifyTrack?.title?.contains ||
            trackCond.spotifyTrack?.artist?.name?.contains ||
            trackCond.spotifyTrack?.album?.name?.contains ||
            "";
          if (searchTerm) break;
        }

        query = query.where((eb) =>
          eb.or([
            eb("st.title", "ilike", `%${searchTerm}%`),
            eb(
              sql`EXISTS (
                SELECT 1 FROM "SpotifyArtist" sar
                WHERE sar.id = st."artistId"
                AND sar.name ILIKE ${`%${searchTerm}%`}
              )`,
              "=",
              sql`true`,
            ),
            eb(
              sql`EXISTS (
                SELECT 1 FROM "SpotifyAlbum" sa
                WHERE sa.id = st."albumId"
                AND sa.name ILIKE ${`%${searchTerm}%`}
              )`,
              "=",
              sql`true`,
            ),
          ]),
        );
      }
    }

    // Handle AND conditions (Smart Playlist rules)
    // When smart playlists use AND logic, each condition must be applied to the query.
    // Note: Prisma's buildCondition methods can return either direct values (for EQUALS)
    // or nested objects (for other operators), so we check typeof before applying filters.
    if (where.AND && Array.isArray(where.AND) && where.AND.length > 0) {
      for (const condition of where.AND) {
        const andCond = condition as Prisma.UserTrackWhereInput;

        // Handle nested spotifyTrack conditions (title, artist, album, duration)
        if (andCond.spotifyTrack) {
          const trackCond = andCond.spotifyTrack as {
            album?: {
              name?: {
                contains?: string;
                endsWith?: string;
                mode?: string;
                not?: string;
                NOT?: { contains?: string; mode?: string };
                startsWith?: string;
              };
            };
            artist?: {
              name?: {
                contains?: string;
                endsWith?: string;
                mode?: string;
                not?: string;
                NOT?: { contains?: string; mode?: string };
                startsWith?: string;
              };
            };
            duration?: {
              equals?: number;
              gt?: number;
              gte?: number;
              lt?: number;
              lte?: number;
            };
            title?: {
              contains?: string;
              endsWith?: string;
              mode?: string;
              not?: string;
              NOT?: { contains?: string; mode?: string };
              startsWith?: string;
            };
          };

          // Handle title filter
          if (trackCond.title !== undefined) {
            if (typeof trackCond.title === "string") {
              // Direct value (from EQUALS operator)
              query = query.where("st.title", "=", trackCond.title);
            } else if (typeof trackCond.title === "object") {
              if (trackCond.title.contains) {
                query = query.where(
                  "st.title",
                  "ilike",
                  `%${trackCond.title.contains}%`,
                );
              } else if (trackCond.title.startsWith) {
                query = query.where(
                  "st.title",
                  "ilike",
                  `${trackCond.title.startsWith}%`,
                );
              } else if (trackCond.title.endsWith) {
                query = query.where(
                  "st.title",
                  "ilike",
                  `%${trackCond.title.endsWith}`,
                );
              } else if (trackCond.title.not) {
                query = query.where("st.title", "!=", trackCond.title.not);
              } else if (trackCond.title.NOT?.contains) {
                query = query.where(
                  "st.title",
                  "not ilike",
                  `%${trackCond.title.NOT.contains}%`,
                );
              }
            }
          }

          // Handle artist filter
          if (trackCond.artist?.name !== undefined) {
            const artistName = trackCond.artist.name;
            if (typeof artistName === "string") {
              // Direct value (from EQUALS operator)
              query = query.where(({ eb }) =>
                eb(
                  sql`EXISTS (
                    SELECT 1 FROM "SpotifyArtist" sar
                    WHERE sar.id = st."artistId"
                    AND sar.name = ${artistName}
                  )`,
                  "=",
                  sql`true`,
                ),
              );
            } else if (typeof artistName === "object") {
              if (artistName.contains) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyArtist" sar
                      WHERE sar.id = st."artistId"
                      AND sar.name ILIKE ${`%${artistName.contains}%`}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              } else if (artistName.startsWith) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyArtist" sar
                      WHERE sar.id = st."artistId"
                      AND sar.name ILIKE ${`${artistName.startsWith}%`}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              } else if (artistName.endsWith) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyArtist" sar
                      WHERE sar.id = st."artistId"
                      AND sar.name ILIKE ${`%${artistName.endsWith}`}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              } else if (artistName.not) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyArtist" sar
                      WHERE sar.id = st."artistId"
                      AND sar.name != ${artistName.not}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              } else if (artistName.NOT?.contains) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyArtist" sar
                      WHERE sar.id = st."artistId"
                      AND sar.name NOT ILIKE ${`%${artistName.NOT.contains}%`}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              }
            }
          }

          // Handle album filter
          if (trackCond.album?.name !== undefined) {
            const albumName = trackCond.album.name;
            if (typeof albumName === "string") {
              // Direct value (from EQUALS operator)
              query = query.where(({ eb }) =>
                eb(
                  sql`EXISTS (
                    SELECT 1 FROM "SpotifyAlbum" sa
                    WHERE sa.id = st."albumId"
                    AND sa.name = ${albumName}
                  )`,
                  "=",
                  sql`true`,
                ),
              );
            } else if (typeof albumName === "object") {
              if (albumName.contains) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyAlbum" sa
                      WHERE sa.id = st."albumId"
                      AND sa.name ILIKE ${`%${albumName.contains}%`}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              } else if (albumName.startsWith) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyAlbum" sa
                      WHERE sa.id = st."albumId"
                      AND sa.name ILIKE ${`${albumName.startsWith}%`}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              } else if (albumName.endsWith) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyAlbum" sa
                      WHERE sa.id = st."albumId"
                      AND sa.name ILIKE ${`%${albumName.endsWith}`}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              } else if (albumName.not) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyAlbum" sa
                      WHERE sa.id = st."albumId"
                      AND sa.name != ${albumName.not}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              } else if (albumName.NOT?.contains) {
                query = query.where(({ eb }) =>
                  eb(
                    sql`EXISTS (
                      SELECT 1 FROM "SpotifyAlbum" sa
                      WHERE sa.id = st."albumId"
                      AND sa.name NOT ILIKE ${`%${albumName.NOT.contains}%`}
                    )`,
                    "=",
                    sql`true`,
                  ),
                );
              }
            }
          }

          // Handle duration filters
          if (trackCond.duration !== undefined) {
            if (typeof trackCond.duration === "number") {
              // Direct value (from EQUALS operator)
              query = query.where("st.duration", "=", trackCond.duration);
            } else if (typeof trackCond.duration === "object") {
              if (trackCond.duration.gte !== undefined) {
                query = query.where(
                  "st.duration",
                  ">=",
                  trackCond.duration.gte,
                );
              }
              if (trackCond.duration.lte !== undefined) {
                query = query.where(
                  "st.duration",
                  "<=",
                  trackCond.duration.lte,
                );
              }
              if (trackCond.duration.gt !== undefined) {
                query = query.where("st.duration", ">", trackCond.duration.gt);
              }
              if (trackCond.duration.lt !== undefined) {
                query = query.where("st.duration", "<", trackCond.duration.lt);
              }
              if (trackCond.duration.equals !== undefined) {
                query = query.where(
                  "st.duration",
                  "=",
                  trackCond.duration.equals,
                );
              }
            }
          }
        }

        // Handle addedAt filter
        if (andCond.addedAt) {
          const dateFilter = andCond.addedAt as {
            equals?: Date;
            gt?: Date;
            gte?: Date;
            lt?: Date;
            lte?: Date;
          };
          if (dateFilter.gte) {
            query = query.where("ut.addedAt", ">=", dateFilter.gte);
          }
          if (dateFilter.lte) {
            query = query.where("ut.addedAt", "<=", dateFilter.lte);
          }
          if (dateFilter.gt) {
            query = query.where("ut.addedAt", ">", dateFilter.gt);
          }
          if (dateFilter.lt) {
            query = query.where("ut.addedAt", "<", dateFilter.lt);
          }
          if (dateFilter.equals) {
            query = query.where("ut.addedAt", "=", dateFilter.equals);
          }
        }

        // Handle lastPlayedAt filter
        if (andCond.lastPlayedAt) {
          const dateFilter = andCond.lastPlayedAt as {
            equals?: Date;
            gt?: Date;
            gte?: Date;
            lt?: Date;
            lte?: Date;
          };
          if (dateFilter.gte) {
            query = query.where("ut.lastPlayedAt", ">=", dateFilter.gte);
          }
          if (dateFilter.lte) {
            query = query.where("ut.lastPlayedAt", "<=", dateFilter.lte);
          }
          if (dateFilter.gt) {
            query = query.where("ut.lastPlayedAt", ">", dateFilter.gt);
          }
          if (dateFilter.lt) {
            query = query.where("ut.lastPlayedAt", "<", dateFilter.lt);
          }
          if (dateFilter.equals) {
            query = query.where("ut.lastPlayedAt", "=", dateFilter.equals);
          }
        }

        // Handle totalPlayCount filter
        if (andCond.totalPlayCount !== undefined) {
          if (typeof andCond.totalPlayCount === "number") {
            // Direct value (from EQUALS operator)
            query = query.where(
              "ut.totalPlayCount",
              "=",
              andCond.totalPlayCount,
            );
          } else if (typeof andCond.totalPlayCount === "object") {
            const numberFilter = andCond.totalPlayCount as {
              equals?: number;
              gt?: number;
              gte?: number;
              lt?: number;
              lte?: number;
            };
            if (numberFilter.gte !== undefined) {
              query = query.where("ut.totalPlayCount", ">=", numberFilter.gte);
            }
            if (numberFilter.lte !== undefined) {
              query = query.where("ut.totalPlayCount", "<=", numberFilter.lte);
            }
            if (numberFilter.gt !== undefined) {
              query = query.where("ut.totalPlayCount", ">", numberFilter.gt);
            }
            if (numberFilter.lt !== undefined) {
              query = query.where("ut.totalPlayCount", "<", numberFilter.lt);
            }
            if (numberFilter.equals !== undefined) {
              query = query.where(
                "ut.totalPlayCount",
                "=",
                numberFilter.equals,
              );
            }
          }
        }

        // Handle rating filter
        if (andCond.rating !== undefined) {
          if (andCond.rating === null) {
            query = query.where("ut.rating", "is", null);
          } else if (typeof andCond.rating === "number") {
            // Direct value (from EQUALS operator)
            query = query.where("ut.rating", "=", andCond.rating);
          } else if (typeof andCond.rating === "object") {
            const ratingFilter = andCond.rating as {
              equals?: number;
              gt?: number;
              gte?: number;
              lt?: number;
              lte?: number;
              not?: null | number;
            };
            if (ratingFilter.gte !== undefined) {
              query = query.where("ut.rating", ">=", ratingFilter.gte);
            }
            if (ratingFilter.lte !== undefined) {
              query = query.where("ut.rating", "<=", ratingFilter.lte);
            }
            if (ratingFilter.gt !== undefined) {
              query = query.where("ut.rating", ">", ratingFilter.gt);
            }
            if (ratingFilter.lt !== undefined) {
              query = query.where("ut.rating", "<", ratingFilter.lt);
            }
            if (ratingFilter.equals !== undefined) {
              query = query.where("ut.rating", "=", ratingFilter.equals);
            }
            if ("not" in ratingFilter && ratingFilter.not === null) {
              // "not: null" means rating IS NOT NULL (has a rating)
              query = query.where("ut.rating", "is not", null);
            } else if (ratingFilter.not !== undefined) {
              query = query.where("ut.rating", "!=", ratingFilter.not);
            }
          }
        }

        // Handle tags filter
        if (andCond.tags) {
          if (andCond.tags.some) {
            const tagCondition = andCond.tags.some as {
              tag?: { name?: string };
              tagId?: { in?: string[] };
            };

            // Handle specific tag IDs (HAS_ANY_TAG operator or tag filter with multiple tags)
            if (tagCondition.tagId?.in && tagCondition.tagId.in.length > 0) {
              query = query
                .innerJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
                .where("tt.tagId", "in", tagCondition.tagId.in);
            }
            // Handle specific tag name (HAS_TAG operator)
            else if (tagCondition.tag?.name) {
              query = query.where(({ eb }) =>
                eb(
                  sql`EXISTS (
                    SELECT 1 FROM "TrackTag" tt
                    INNER JOIN "Tag" t ON t.id = tt."tagId"
                    WHERE tt."userTrackId" = ut.id
                    AND t.name = ${tagCondition.tag.name}
                  )`,
                  "=",
                  sql`true`,
                ),
              );
            }
            // Handle HAS_ANY_TAG operator (empty some clause)
            else {
              query = query.where(({ eb }) =>
                eb(
                  sql`EXISTS (
                    SELECT 1 FROM "TrackTag" tt
                    WHERE tt."userTrackId" = ut.id
                  )`,
                  "=",
                  sql`true`,
                ),
              );
            }
          } else if (andCond.tags.none) {
            const noneCondition = andCond.tags.none as {
              tag?: { name?: string };
            };

            // Handle NOT_HAS_TAG operator (specific tag name)
            if (noneCondition.tag?.name) {
              query = query.where(({ eb }) =>
                eb(
                  sql`NOT EXISTS (
                    SELECT 1 FROM "TrackTag" tt
                    INNER JOIN "Tag" t ON t.id = tt."tagId"
                    WHERE tt."userTrackId" = ut.id
                    AND t.name = ${noneCondition.tag.name}
                  )`,
                  "=",
                  sql`true`,
                ),
              );
            }
            // Handle HAS_NO_TAGS operator (no tags at all)
            else {
              query = query.where(({ eb }) =>
                eb(
                  sql`NOT EXISTS (
                    SELECT 1 FROM "TrackTag" tt
                    WHERE tt."userTrackId" = ut.id
                  )`,
                  "=",
                  sql`true`,
                ),
              );
            }
          }
        }
      }
    }

    // Handle tag filter
    if (where.tags?.some) {
      const tagCondition = where.tags.some as { tagId?: { in?: string[] } };
      if (tagCondition.tagId?.in) {
        query = query
          .innerJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
          .where("tt.tagId", "in", tagCondition.tagId.in);
      }
    }

    // Handle rating filters
    if (where.rating === null) {
      query = query.where("ut.rating", "is", null);
    } else if (
      where.rating &&
      typeof where.rating === "object" &&
      "gte" in where.rating
    ) {
      const minRating = where.rating.gte as number;
      query = query.where("ut.rating", ">=", minRating);
    } else if (
      where.rating &&
      typeof where.rating === "object" &&
      "lte" in where.rating
    ) {
      const maxRating = where.rating.lte as number;
      query = query.where("ut.rating", "<=", maxRating);
    } else if (
      where.rating &&
      typeof where.rating === "object" &&
      "equals" in where.rating
    ) {
      const exactRating = where.rating.equals as number;
      query = query.where("ut.rating", "=", exactRating);
    }

    // Handle source type filter
    if (where.sources?.some) {
      const sourceCondition = where.sources.some as {
        sourceType?: { in?: string[] };
      };
      if (
        sourceCondition.sourceType?.in &&
        sourceCondition.sourceType.in.length > 0
      ) {
        const sourceTypes = sourceCondition.sourceType.in as SourceType[];
        query = query
          .innerJoin("TrackSource as ts", "ut.id", "ts.userTrackId")
          .where("ts.sourceType", "in", sourceTypes);
      }
    }

    // Handle genre filter
    if (where.spotifyTrack?.artist?.genres?.hasSome) {
      const genres = where.spotifyTrack.artist.genres.hasSome as string[];
      query = query.where(({ eb }) =>
        eb(
          sql`EXISTS (
            SELECT 1 FROM "SpotifyArtist" sar
            WHERE sar.id = st."artistId"
            AND sar.genres && ARRAY[${sql.join(genres.map((g) => sql.lit(g)))}]::text[]
          )`,
          "=",
          sql`true`,
        ),
      );
    }

    // Handle date filters (addedAt, lastPlayedAt)
    if (where.addedAt) {
      const dateFilter = where.addedAt as {
        equals?: Date;
        gt?: Date;
        gte?: Date;
        lt?: Date;
        lte?: Date;
      };
      if (dateFilter.gte) {
        query = query.where("ut.addedAt", ">=", dateFilter.gte);
      }
      if (dateFilter.lte) {
        query = query.where("ut.addedAt", "<=", dateFilter.lte);
      }
      if (dateFilter.gt) {
        query = query.where("ut.addedAt", ">", dateFilter.gt);
      }
      if (dateFilter.lt) {
        query = query.where("ut.addedAt", "<", dateFilter.lt);
      }
      if (dateFilter.equals) {
        query = query.where("ut.addedAt", "=", dateFilter.equals);
      }
    }

    if (where.lastPlayedAt) {
      const dateFilter = where.lastPlayedAt as {
        equals?: Date;
        gt?: Date;
        gte?: Date;
        lt?: Date;
        lte?: Date;
      };
      if (dateFilter.gte) {
        query = query.where("ut.lastPlayedAt", ">=", dateFilter.gte);
      }
      if (dateFilter.lte) {
        query = query.where("ut.lastPlayedAt", "<=", dateFilter.lte);
      }
      if (dateFilter.gt) {
        query = query.where("ut.lastPlayedAt", ">", dateFilter.gt);
      }
      if (dateFilter.lt) {
        query = query.where("ut.lastPlayedAt", "<", dateFilter.lt);
      }
      if (dateFilter.equals) {
        query = query.where("ut.lastPlayedAt", "=", dateFilter.equals);
      }
    }

    // Handle number filters (totalPlayCount, duration)
    if (where.totalPlayCount) {
      const numberFilter = where.totalPlayCount as {
        equals?: number;
        gt?: number;
        gte?: number;
        lt?: number;
        lte?: number;
      };
      if (numberFilter.gte) {
        query = query.where("ut.totalPlayCount", ">=", numberFilter.gte);
      }
      if (numberFilter.lte) {
        query = query.where("ut.totalPlayCount", "<=", numberFilter.lte);
      }
      if (numberFilter.gt) {
        query = query.where("ut.totalPlayCount", ">", numberFilter.gt);
      }
      if (numberFilter.lt) {
        query = query.where("ut.totalPlayCount", "<", numberFilter.lt);
      }
      if (numberFilter.equals) {
        query = query.where("ut.totalPlayCount", "=", numberFilter.equals);
      }
    }

    if (where.spotifyTrack?.duration) {
      const numberFilter = where.spotifyTrack.duration as {
        equals?: number;
        gt?: number;
        gte?: number;
        lt?: number;
        lte?: number;
      };
      if (numberFilter.gte) {
        query = query.where("st.duration", ">=", numberFilter.gte);
      }
      if (numberFilter.lte) {
        query = query.where("st.duration", "<=", numberFilter.lte);
      }
      if (numberFilter.gt) {
        query = query.where("st.duration", ">", numberFilter.gt);
      }
      if (numberFilter.lt) {
        query = query.where("st.duration", "<", numberFilter.lt);
      }
      if (numberFilter.equals) {
        query = query.where("st.duration", "=", numberFilter.equals);
      }
    }

    // Use PostgreSQL's RANDOM() for true random sampling at DB level
    query = query.orderBy(sql`RANDOM()`).limit(maxTracks);

    const tracks = await query.execute();

    const spotifyUris = tracks
      .filter((track) => track.spotifyId)
      .map((track) => `spotify:track:${track.spotifyId}`);

    this.logger.log(
      `Fetched ${spotifyUris.length} randomly ordered tracks for shuffle using database randomization`,
    );

    return spotifyUris;
  }

  async getAlbumTracks(
    userId: string,
    artist: string,
    album: string,
  ): Promise<{ tracks: TrackDto[] }> {
    const db = this.kyselyService.database;

    // Single optimized query with all joins
    const tracks = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .leftJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
      .leftJoin("Tag as t", "tt.tagId", "t.id")
      .leftJoin("TrackSource as ts", "ut.id", "ts.userTrackId")
      .select([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name as albumName",
        "sa.imageUrl as albumImageUrl",
        "sar.name as artistName",
        "sar.genres as artistGenres",
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
          )`.as("tags"),
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
          )`.as("sources"),
      ])
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .where("sar.name", "=", artist)
      .where("sa.name", "=", album)
      .groupBy([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name",
        "sa.imageUrl",
        "sar.name",
        "sar.genres",
      ])
      .orderBy("st.title", "asc")
      .execute();

    // Transform to DTOs
    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.albumName,
        albumArt: track.albumImageUrl,
        albumId: track.albumId,
        artist: track.artistName,
        artistGenres: track.artistGenres,
        artistId: track.artistId,
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
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .leftJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
      .leftJoin("Tag as t", "tt.tagId", "t.id")
      .leftJoin("TrackSource as ts", "ut.id", "ts.userTrackId")
      .select([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name as albumName",
        "sa.imageUrl as albumImageUrl",
        "sar.name as artistName",
        "sar.genres as artistGenres",
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
          )`.as("tags"),
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
          )`.as("sources"),
      ])
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .where("sar.name", "=", artist)
      .groupBy([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name",
        "sa.imageUrl",
        "sar.name",
        "sar.genres",
      ])
      .orderBy("sa.name", "asc")
      .orderBy("st.title", "asc")
      .execute();

    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.albumName,
        albumArt: track.albumImageUrl,
        albumId: track.albumId,
        artist: track.artistName,
        artistGenres: track.artistGenres,
        artistId: track.artistId,
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

  async getDashboardStats(userId: string) {
    const db = this.kyselyService.database;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get basic counts
    const [totalTracksCount, totalAlbumsCount, totalArtistsCount] =
      await Promise.all([
        this.databaseService.userTrack.count({ where: { userId } }),
        this.databaseService.userAlbum.count({ where: { userId } }),
        this.databaseService.userArtist.count({ where: { userId } }),
      ]);

    // Get rating stats
    const ratingStats = await db
      .selectFrom("UserTrack")
      .select([
        sql<number>`COUNT(*)`.as("totalTracks"),
        sql<number>`COUNT(rating)`.as("ratedTracks"),
        sql<number>`AVG(rating)`.as("averageRating"),
      ])
      .where("userId", "=", userId)
      .executeTakeFirst();

    // Get activity stats for the past week
    const activityStats = await db
      .selectFrom("UserTrack")
      .select([
        sql<number>`COUNT(*) FILTER (WHERE "addedAt" >= ${sevenDaysAgo})`.as(
          "tracksAddedThisWeek",
        ),
        sql<number>`COUNT(*) FILTER (WHERE "lastPlayedAt" >= ${sevenDaysAgo})`.as(
          "tracksPlayedThisWeek",
        ),
        sql<number>`COUNT(*) FILTER (WHERE "ratedAt" >= ${sevenDaysAgo})`.as(
          "tracksRatedThisWeek",
        ),
      ])
      .where("userId", "=", userId)
      .executeTakeFirst();

    // Get actual play count from PlayHistory for the past week
    const playCountResult = await db
      .selectFrom("PlayHistory as ph")
      .innerJoin("UserTrack as ut", "ph.userTrackId", "ut.id")
      .select(sql<number>`COUNT(*)`.as("totalPlaysThisWeek"))
      .where("ut.userId", "=", userId)
      .where("ph.playedAt", ">=", sevenDaysAgo)
      .executeTakeFirst();

    // Get top 3 most played tracks this week
    const topTracksThisWeek = await db
      .selectFrom("PlayHistory as ph")
      .innerJoin("UserTrack as ut", "ph.userTrackId", "ut.id")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyArtist as sa", "st.artistId", "sa.id")
      .innerJoin("SpotifyAlbum as album", "st.albumId", "album.id")
      .select([
        "st.title as name",
        "sa.name as info",
        "album.imageUrl",
        "st.spotifyId",
        "ut.id",
        sql<number>`COUNT(*)`.as("count"),
      ])
      .where("ut.userId", "=", userId)
      .where("ph.playedAt", ">=", sevenDaysAgo)
      .groupBy([
        "st.id",
        "st.title",
        "sa.name",
        "album.imageUrl",
        "st.spotifyId",
        "ut.id",
      ])
      .orderBy("count", "desc")
      .limit(3)
      .execute();

    // Get top 3 most played artists this week
    const topArtistsThisWeek = await db
      .selectFrom("PlayHistory as ph")
      .innerJoin("UserTrack as ut", "ph.userTrackId", "ut.id")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyArtist as sa", "st.artistId", "sa.id")
      .select([
        "sa.name",
        "sa.imageUrl",
        "sa.spotifyId",
        "sa.id",
        sql<number>`COUNT(*)`.as("count"),
      ])
      .where("ut.userId", "=", userId)
      .where("ph.playedAt", ">=", sevenDaysAgo)
      .groupBy(["sa.id", "sa.name", "sa.imageUrl", "sa.spotifyId"])
      .orderBy("count", "desc")
      .limit(3)
      .execute();

    // Get tag statistics using Prisma to avoid Kysely join issues
    const totalTags = await this.databaseService.tag.count({
      where: { userId },
    });

    const taggedTracksRaw = await this.databaseService.trackTag.groupBy({
      by: ["userTrackId"],
      where: { userTrack: { userId } },
    });

    const taggedTracks = taggedTracksRaw.length;

    const tagsWithCounts = await this.databaseService.tag.findMany({
      include: { _count: { select: { tracks: true } } },
      orderBy: { tracks: { _count: "desc" } },
      take: 5,
      where: { userId },
    });

    const topTags = tagsWithCounts.map((tag) => ({
      color: tag.color || undefined,
      count: tag._count.tracks,
      id: tag.id,
      name: tag.name,
    }));

    // Get last sync date from user
    const user = await this.databaseService.user.findUnique({
      select: { lastPlaySyncedAt: true },
      where: { id: userId },
    });

    const totalTracks = ratingStats?.totalTracks || 0;
    const ratedTracks = ratingStats?.ratedTracks || 0;
    const unratedTracks = totalTracks - ratedTracks;
    const percentageRated =
      totalTracks > 0 ? Math.round((ratedTracks / totalTracks) * 100) : 0;

    const percentageTagged =
      totalTracksCount > 0
        ? Math.round((taggedTracks / totalTracksCount) * 100)
        : 0;

    return {
      activityStats: {
        totalPlaysThisWeek: Number(playCountResult?.totalPlaysThisWeek || 0),
        tracksAddedThisWeek: Number(activityStats?.tracksAddedThisWeek || 0),
        tracksPlayedThisWeek: Number(activityStats?.tracksPlayedThisWeek || 0),
        tracksRatedThisWeek: Number(activityStats?.tracksRatedThisWeek || 0),
      },
      isSynced: totalTracksCount > 0,
      lastSyncedAt: user?.lastPlaySyncedAt,
      ratingStats: {
        averageRating: Number(ratingStats?.averageRating || 0),
        percentageRated,
        ratedTracks,
        totalTracks,
        unratedTracks,
      },
      tagStats: {
        percentageTagged,
        taggedTracks,
        topTags: topTags.map((tag) => ({
          count: Number(tag.count),
          id: tag.id,
          info: tag.color || undefined,
          name: tag.name,
        })),
        totalTags,
      },
      topArtistsThisWeek: topArtistsThisWeek.map((artist) => ({
        count: Number(artist.count),
        id: artist.id,
        imageUrl: artist.imageUrl || undefined,
        name: artist.name,
        spotifyId: artist.spotifyId,
      })),
      topTracksThisWeek: topTracksThisWeek.map((track) => ({
        count: Number(track.count),
        id: track.id,
        imageUrl: track.imageUrl || undefined,
        info: track.info || undefined,
        name: track.name,
        spotifyId: track.spotifyId,
      })),
      totalAlbums: totalAlbumsCount,
      totalArtists: totalArtistsCount,
      totalTracks: totalTracksCount,
    };
  }

  async getPlayHistory(
    userId: string,
    query: GetPlayHistoryQueryDto,
  ): Promise<PaginatedPlayHistoryDto> {
    const {
      includeNonLibrary = true,
      page = 1,
      pageSize = 50,
      search,
      trackId,
    } = query;

    const db = this.kyselyService.database;

    // Build the base query
    let baseQuery = db
      .selectFrom("PlayHistory as ph")
      .innerJoin("UserTrack as ut", "ph.userTrackId", "ut.id")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .where("ut.userId", "=", userId);

    // Add search filter
    if (search) {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("st.title", "ilike", `%${search}%`),
          eb("sar.name", "ilike", `%${search}%`),
          eb("sa.name", "ilike", `%${search}%`),
        ]),
      );
    }

    // Add track filter
    if (trackId) {
      baseQuery = baseQuery.where("ut.id", "=", trackId);
    }

    // Add library filter
    if (!includeNonLibrary) {
      baseQuery = baseQuery.where("ut.addedToLibrary", "=", true);
    }

    // Get total count
    const countResult = await baseQuery
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    // Get paginated results
    const skip = (page - 1) * pageSize;
    const plays = await baseQuery
      .select([
        "ph.id",
        "ph.playedAt",
        "ph.duration",
        "ut.id as trackId",
        "ut.addedToLibrary as trackAddedToLibrary",
        "st.title as trackTitle",
        "st.duration as trackDuration",
        "st.spotifyId as trackSpotifyId",
        "sar.name as trackArtist",
        "sa.name as trackAlbum",
        "sa.imageUrl as trackAlbumArt",
      ])
      .orderBy("ph.playedAt", "desc")
      .limit(pageSize)
      .offset(skip)
      .execute();

    // Transform to DTOs
    const items = plays.map((play) => {
      const dto = {
        duration: play.duration,
        id: play.id,
        playedAt: play.playedAt,
        trackAddedToLibrary: play.trackAddedToLibrary,
        trackAlbum: play.trackAlbum,
        trackAlbumArt: play.trackAlbumArt,
        trackArtist: play.trackArtist,
        trackDuration: play.trackDuration,
        trackId: play.trackId,
        trackSpotifyId: play.trackSpotifyId,
        trackTitle: play.trackTitle,
      };
      return plainToInstance(PlayHistoryItemDto, dto, {
        excludeExtraneousValues: true,
      });
    });

    const totalPages = Math.ceil(total / pageSize);

    return plainToInstance(
      PaginatedPlayHistoryDto,
      { items, page, pageSize, total, totalPages },
      { excludeExtraneousValues: true },
    );
  }

  async getPlaylistTracks(
    userId: string,
    playlistId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PlaylistTracksResponseDto> {
    const db = this.kyselyService.database;

    // Get playlist metadata
    const playlist = await this.databaseService.userPlaylist.findFirst({
      where: { id: playlistId, userId },
    });

    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }

    // Get total count for pagination
    const countResult = await db
      .selectFrom("TrackSource as ts")
      .innerJoin("UserTrack as ut", "ut.id", "ts.userTrackId")
      .select(sql<number>`count(*)`.as("count"))
      .where("ts.sourceType", "=", "PLAYLIST")
      .where("ts.sourceId", "=", playlist.spotifyId)
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);
    const totalPages = Math.ceil(total / pageSize);
    const offset = (page - 1) * pageSize;

    // Get tracks from TrackSource where sourceType is PLAYLIST and sourceId matches
    const tracks = await db
      .selectFrom("TrackSource as ts")
      .innerJoin("UserTrack as ut", "ut.id", "ts.userTrackId")
      .innerJoin("SpotifyTrack as st", "st.id", "ut.spotifyTrackId")
      .innerJoin("SpotifyAlbum as sa", "sa.id", "st.albumId")
      .innerJoin("SpotifyArtist as sar", "sar.id", "st.artistId")
      .leftJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
      .leftJoin("Tag as t", "tt.tagId", "t.id")
      .select([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name as albumName",
        "sa.imageUrl as albumImageUrl",
        "sar.name as artistName",
        "sar.genres as artistGenres",
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
          )`.as("tags"),
      ])
      .where("ts.sourceType", "=", "PLAYLIST")
      .where("ts.sourceId", "=", playlist.spotifyId)
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .groupBy([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name",
        "sa.imageUrl",
        "sar.name",
        "sar.genres",
        "ts.createdAt",
      ])
      .orderBy("ts.createdAt", "asc")
      .offset(offset)
      .limit(pageSize)
      .execute();

    // Transform to DTOs
    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.albumName,
        albumArt: track.albumImageUrl,
        albumId: track.albumId,
        artist: track.artistName,
        artistGenres: track.artistGenres,
        artistId: track.artistId,
        duration: track.duration,
        id: track.id,
        lastPlayedAt: track.lastPlayedAt,
        ratedAt: track.ratedAt,
        rating: track.rating,
        spotifyId: track.spotifyId,
        tags: track.tags,
        title: track.title,
        totalPlayCount: track.totalPlayCount,
      };
      return plainToInstance(TrackDto, dto, { excludeExtraneousValues: true });
    });

    return {
      description: playlist.description,
      imageUrl: playlist.imageUrl,
      name: playlist.name,
      page,
      pageSize,
      spotifyId: playlist.spotifyId,
      total,
      totalPages,
      tracks: trackDtos,
    };
  }

  /**
   * Get random unrated tracks for onboarding
   * Returns full TrackDto objects (not just URIs)
   */
  async getRandomUnratedTracks(
    userId: string,
    limit: number,
  ): Promise<TrackDto[]> {
    const db = this.kyselyService.database;

    // Build query with all joins needed for full TrackDto
    const tracks = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .leftJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
      .leftJoin("Tag as t", "tt.tagId", "t.id")
      .leftJoin("TrackSource as ts", "ut.id", "ts.userTrackId")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .where("ut.rating", "is", null) // Only unrated tracks
      .select([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name as albumName",
        "sa.imageUrl as albumImageUrl",
        "sar.name as artistName",
        "sar.genres as artistGenres",
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
          )`.as("tags"),
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
          )`.as("sources"),
      ])
      .groupBy([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name",
        "sa.imageUrl",
        "sar.name",
        "sar.genres",
      ])
      .orderBy(sql`RANDOM()`)
      .limit(limit)
      .execute();

    // Transform to DTOs
    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.albumName,
        albumArt: track.albumImageUrl,
        albumId: track.albumId,
        artist: track.artistName,
        artistGenres: track.artistGenres,
        artistId: track.artistId,
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

    this.logger.log(
      `Fetched ${trackDtos.length} random unrated tracks for onboarding`,
    );

    return trackDtos;
  }

  async getTrackById(
    userId: string,
    trackId: string,
  ): Promise<null | TrackDto> {
    const track = await this.databaseService.userTrack.findFirst({
      include: {
        sources: true,
        spotifyTrack: {
          include: { album: { include: { artist: true } }, artist: true },
        },
        tags: { include: { tag: true } },
      },
      where: { id: trackId, userId },
    });

    if (!track) {
      return null;
    }

    const dto = {
      addedAt: track.addedAt,
      album: track.spotifyTrack.album?.name || null,
      albumArt: track.spotifyTrack.album?.imageUrl || null,
      albumId: track.spotifyTrack.albumId,
      artist: track.spotifyTrack.artist.name,
      artistGenres: track.spotifyTrack.artist.genres,
      artistId: track.spotifyTrack.artistId,
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

  async getTrackBySpotifyId(
    userId: string,
    spotifyId: string,
  ): Promise<null | TrackDto> {
    const track = await this.databaseService.userTrack.findFirst({
      include: {
        sources: true,
        spotifyTrack: {
          include: { album: { include: { artist: true } }, artist: true },
        },
        tags: { include: { tag: true } },
      },
      where: { spotifyTrack: { spotifyId }, userId },
    });

    if (!track) {
      return null;
    }

    const dto = {
      addedAt: track.addedAt,
      album: track.spotifyTrack.album?.name || null,
      albumArt: track.spotifyTrack.album?.imageUrl || null,
      albumId: track.spotifyTrack.albumId,
      artist: track.spotifyTrack.artist.name,
      artistGenres: track.spotifyTrack.artist.genres,
      artistId: track.spotifyTrack.artistId,
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
   * Get track IDs matching a filter
   * Used for bulk operations
   */
  async getTrackIdsByFilter(
    userId: string,
    filter: BulkOperationFilterDto,
  ): Promise<string[]> {
    const db = this.kyselyService.database;

    // Build base query with distinct to avoid duplicates from tag/source joins
    let query = db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .select("ut.id")
      .distinct()
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true);

    // Apply album filter
    if (filter.albumId) {
      query = query.where("st.albumId", "=", filter.albumId);
    }

    // Apply artist filter
    if (filter.artistId) {
      query = query.where("st.artistId", "=", filter.artistId);
    }

    // Apply search filter
    if (filter.search) {
      query = query.where((eb) =>
        eb.or([
          eb("st.title", "ilike", `%${filter.search}%`),
          eb("sar.name", "ilike", `%${filter.search}%`),
          eb("sa.name", "ilike", `%${filter.search}%`),
        ]),
      );
    }

    // Apply genre filter
    if (filter.genres && filter.genres.length > 0) {
      query = query.where(({ eb }) =>
        eb(
          sql`sar.genres && ARRAY[${sql.join(filter.genres!.map((g) => sql.lit(g)))}]::text[]`,
          "=",
          sql`true`,
        ),
      );
    }

    // Apply rating filter
    if (filter.minRating) {
      query = query.where("ut.rating", ">=", filter.minRating);
    }

    // Apply unrated filter
    if (filter.unratedOnly) {
      query = query.where("ut.rating", "is", null);
    }

    // Apply tag filter
    if (filter.tagIds && filter.tagIds.length > 0) {
      query = query
        .innerJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
        .where("tt.tagId", "in", filter.tagIds);
    }

    // Apply source type filter
    if (filter.sourceTypes && filter.sourceTypes.length > 0) {
      query = query
        .innerJoin("TrackSource as ts", "ut.id", "ts.userTrackId")
        .where("ts.sourceType", "in", filter.sourceTypes);
    }

    // Apply Spotify playlist filter (tracks from a specific Spotify library playlist)
    if (filter.spotifyPlaylistId) {
      query = query
        .innerJoin(
          "TrackSource as tsPlaylist",
          "ut.id",
          "tsPlaylist.userTrackId",
        )
        .where("tsPlaylist.sourceType", "=", "PLAYLIST")
        .where("tsPlaylist.sourceId", "=", filter.spotifyPlaylistId);
    }

    // TODO: Add smart playlist support when needed
    // For now, playlistId is not supported

    const tracks = await query.execute();
    return tracks.map((t) => t.id);
  }

  async getTracksForPlay(
    userId: string,
    query: GetTracksQueryDto & { shouldShuffle?: boolean; skip?: number },
  ): Promise<string[]> {
    const { shouldShuffle, skip = 0, ...trackQuery } = query;

    // Build where clause - MUST match getUserTracks exactly for index consistency
    const where: Prisma.UserTrackWhereInput = {
      addedToLibrary: true, // Only include tracks explicitly in library (matches getUserTracks)
      userId,
    };

    if (trackQuery.search) {
      where.OR = [
        {
          spotifyTrack: {
            title: { contains: trackQuery.search, mode: "insensitive" },
          },
        },
        {
          spotifyTrack: {
            artist: {
              name: { contains: trackQuery.search, mode: "insensitive" },
            },
          },
        },
        {
          spotifyTrack: {
            album: {
              name: { contains: trackQuery.search, mode: "insensitive" },
            },
          },
        },
      ];
    }

    if (trackQuery.tagIds && trackQuery.tagIds.length > 0) {
      where.tags = { some: { tagId: { in: trackQuery.tagIds } } };
    }

    if (trackQuery.minRating) {
      where.rating = { gte: trackQuery.minRating };
    }

    // Add unrated filter - MUST match getUserTracks for index consistency
    if (trackQuery.unratedOnly) {
      where.rating = null;
    }

    if (trackQuery.sourceTypes && trackQuery.sourceTypes.length > 0) {
      where.sources = { some: { sourceType: { in: trackQuery.sourceTypes } } };
    }

    if (trackQuery.genres && trackQuery.genres.length > 0) {
      const genreFilter: Prisma.UserTrackWhereInput = {
        spotifyTrack: { artist: { genres: { hasSome: trackQuery.genres } } },
      };

      if (where.OR) {
        where.AND = [{ OR: where.OR }, genreFilter];
        delete where.OR;
      } else {
        Object.assign(where, genreFilter);
      }
    }

    // If shuffling, use random order to get truly random tracks from entire library
    if (shouldShuffle) {
      this.logger.log("Using random order for shuffle");
      return this.fetchTracksForPlayWithRandomOrder(userId, where, 500);
    }

    // Build orderBy clause with secondary sort for deterministic ordering
    let orderBy: Prisma.UserTrackOrderByWithRelationInput[] = [];
    const sortOrder = trackQuery.sortOrder || "desc";
    const sortBy = trackQuery.sortBy || "addedAt";

    this.logger.log(
      `Building orderBy for sortBy="${sortBy}", sortOrder="${sortOrder}", skip=${skip}`,
    );

    switch (sortBy) {
      case "addedAt":
        orderBy = [
          { addedAt: sortOrder },
          { spotifyTrack: { album: { name: "asc" } } },
          { spotifyTrack: { trackNumber: "asc" } },
          { id: "asc" },
        ];
        break;
      case "album":
        orderBy = [
          { spotifyTrack: { album: { name: sortOrder } } },
          { spotifyTrack: { trackNumber: "asc" } },
          { id: "asc" },
        ];
        break;
      case "artist":
        orderBy = [
          { spotifyTrack: { artist: { name: sortOrder } } },
          { spotifyTrack: { album: { name: "asc" } } },
          { spotifyTrack: { trackNumber: "asc" } },
          { id: "asc" },
        ];
        break;
      case "duration":
        orderBy = [{ spotifyTrack: { duration: sortOrder } }, { id: "asc" }];
        break;
      case "lastPlayedAt":
        orderBy = [{ lastPlayedAt: sortOrder }, { id: "asc" }];
        break;
      case "rating":
        orderBy = [{ rating: sortOrder }, { addedAt: "desc" }, { id: "asc" }];
        break;
      case "title":
        orderBy = [{ spotifyTrack: { title: sortOrder } }, { id: "asc" }];
        break;
      case "totalPlayCount":
        orderBy = [
          { totalPlayCount: sortOrder },
          { lastPlayedAt: "desc" },
          { id: "asc" },
        ];
        break;
    }

    this.logger.log(`Final orderBy:`, JSON.stringify(orderBy, null, 2));

    // For rating and lastPlayedAt, use Kysely to ensure NULLS LAST behavior
    // matches getUserTracksWithKysely (Prisma doesn't support NULLS LAST)
    if (sortBy === "rating" || sortBy === "lastPlayedAt") {
      return this.fetchTracksForPlayWithKysely(
        userId,
        where,
        sortBy,
        sortOrder,
        500,
        shouldShuffle,
        skip,
      );
    }

    // Get tracks up to 500 max for Spotify API compatibility
    const trackUris = await this.fetchTracksForPlay(
      userId,
      where,
      orderBy,
      500,
      shouldShuffle,
      skip,
    );

    // Log first few tracks for debugging
    this.logger.log(
      `First 5 track URIs after skip=${skip}: ${trackUris.slice(0, 5).join(", ")}`,
    );

    return trackUris;
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
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .select([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "sa.name as albumName",
        "sa.imageUrl as albumImageUrl",
        "sar.name as artistName",
      ])
      .where("ut.userId", "=", userId)
      .orderBy("ut.addedAt", "desc")
      .orderBy("ut.id", "asc") // Stable sort tiebreaker
      .limit(limit + 1); // Fetch one extra to check if more exist

    // Apply cursor if provided
    if (cursor) {
      query = query.where((eb) =>
        eb.or([
          eb("ut.addedAt", "<", cursor.addedAt),
          eb.and([
            eb("ut.addedAt", "=", cursor.addedAt),
            eb("ut.id", ">", cursor.id),
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
        | "artist"
        | "avgRating"
        | "lastPlayed"
        | "name"
        | "totalPlayCount"
        | "trackCount";
      sortOrder: "asc" | "desc";
    },
  ): Promise<PaginatedAlbumsDto> {
    // Build where clause
    const where: Prisma.UserAlbumWhereInput = { userId };

    // Add search filter
    if (options.search) {
      where.OR = [
        { album: { name: { contains: options.search, mode: "insensitive" } } },
        {
          album: {
            artist: { name: { contains: options.search, mode: "insensitive" } },
          },
        },
      ];
    }

    // Add genre filter
    if (options.genres && options.genres.length > 0) {
      const genreFilter: Prisma.UserAlbumWhereInput = {
        album: { artist: { genres: { hasSome: options.genres } } },
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
      case "artist":
        orderBy = { album: { artist: { name: options.sortOrder } } };
        break;
      case "avgRating":
        orderBy = { avgRating: options.sortOrder };
        break;
      case "lastPlayed":
        orderBy = { lastPlayedAt: options.sortOrder };
        break;
      case "name":
        orderBy = { album: { name: options.sortOrder } };
        break;
      case "totalPlayCount":
        orderBy = { totalPlayCount: options.sortOrder };
        break;
      case "trackCount":
        orderBy = { trackCount: options.sortOrder };
        break;
    }

    // Calculate pagination
    const skip = (options.page - 1) * options.pageSize;

    // Execute queries
    const [userAlbums, total] = await Promise.all([
      this.databaseService.userAlbum.findMany({
        include: { album: { include: { artist: true } } },
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
        | "albumCount"
        | "avgRating"
        | "lastPlayed"
        | "name"
        | "totalPlayCount"
        | "trackCount";
      sortOrder: "asc" | "desc";
    },
  ): Promise<PaginatedArtistsDto> {
    // Build where clause
    const where: Prisma.UserArtistWhereInput = { userId };

    // Add search filter
    if (options.search) {
      where.artist = {
        name: { contains: options.search, mode: "insensitive" },
      };
    }

    // Add genre filter
    if (options.genres && options.genres.length > 0) {
      if (options.search) {
        // If we have both search and genre filter, we need to combine them
        where.artist = {
          AND: [
            { name: { contains: options.search, mode: "insensitive" } },
            { genres: { hasSome: options.genres } },
          ],
        };
      } else {
        // Just genre filter
        where.artist = { genres: { hasSome: options.genres } };
      }
    }

    // Build orderBy clause
    let orderBy: Prisma.UserArtistOrderByWithRelationInput = {};
    switch (options.sortBy) {
      case "albumCount":
        orderBy = { albumCount: options.sortOrder };
        break;
      case "avgRating":
        orderBy = { avgRating: options.sortOrder };
        break;
      case "lastPlayed":
        orderBy = { lastPlayedAt: options.sortOrder };
        break;
      case "name":
        orderBy = { artist: { name: options.sortOrder } };
        break;
      case "totalPlayCount":
        orderBy = { totalPlayCount: options.sortOrder };
        break;
      case "trackCount":
        orderBy = { trackCount: options.sortOrder };
        break;
    }

    // Calculate pagination
    const skip = (options.page - 1) * options.pageSize;

    // Execute queries
    const [userArtists, total] = await Promise.all([
      this.databaseService.userArtist.findMany({
        include: { artist: true },
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
      include: { artist: { select: { genres: true } } },
      where: { userId },
    });

    // Extract and flatten all genres
    const allGenres = userArtists
      .map((ua) => ua.artist.genres)
      .flat()
      .filter((genre) => genre && genre.length > 0);

    // Return unique genres sorted alphabetically
    return [...new Set(allGenres)].sort();
  }

  async getUserPlaylists(
    userId: string,
    options: {
      page: number;
      pageSize: number;
      search?: string;
      sortBy:
        | "avgRating"
        | "lastPlayed"
        | "name"
        | "totalPlayCount"
        | "trackCount";
      sortOrder: "asc" | "desc";
    },
  ): Promise<PaginatedPlaylistsDto> {
    // Build where clause
    const where: Prisma.UserPlaylistWhereInput = { userId };

    // Add search filter
    if (options.search) {
      where.name = { contains: options.search, mode: "insensitive" };
    }

    // Build orderBy clause
    let orderBy: Prisma.UserPlaylistOrderByWithRelationInput = {};
    switch (options.sortBy) {
      case "avgRating":
        orderBy = { avgRating: options.sortOrder };
        break;
      case "lastPlayed":
        orderBy = { lastPlayedAt: options.sortOrder };
        break;
      case "name":
        orderBy = { name: options.sortOrder };
        break;
      case "totalPlayCount":
        orderBy = { totalPlayCount: options.sortOrder };
        break;
      case "trackCount":
        orderBy = { totalTracks: options.sortOrder };
        break;
    }

    // Calculate pagination
    const skip = (options.page - 1) * options.pageSize;

    // Execute queries
    const [userPlaylists, total] = await Promise.all([
      this.databaseService.userPlaylist.findMany({
        orderBy,
        skip,
        take: options.pageSize,
        where,
      }),
      this.databaseService.userPlaylist.count({ where }),
    ]);

    // Transform to DTOs
    const playlistDtos = userPlaylists.map((playlist) => {
      return plainToInstance(
        PlaylistDto,
        {
          avgRating: playlist.avgRating,
          collaborative: playlist.collaborative,
          description: playlist.description,
          id: playlist.id,
          imageUrl: playlist.imageUrl,
          lastPlayed: playlist.lastPlayedAt,
          name: playlist.name,
          ownerName: playlist.ownerName,
          public: playlist.public,
          spotifyId: playlist.spotifyId,
          totalDuration: playlist.totalDuration,
          totalPlayCount: playlist.totalPlayCount,
          trackCount: playlist.totalTracks,
        },
        { excludeExtraneousValues: true },
      );
    });

    const totalPages = Math.ceil(total / options.pageSize);

    return plainToInstance(
      PaginatedPlaylistsDto,
      {
        page: options.page,
        pageSize: options.pageSize,
        playlists: playlistDtos,
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
      genres,
      minRating,
      page = 1,
      pageSize = 20,
      search,
      sortBy = "addedAt",
      sortOrder = "desc",
      sourceTypes,
      tagIds,
      unratedOnly,
    } = query;

    // Build where clause
    const where: Prisma.UserTrackWhereInput = {
      addedToLibrary: true, // Only show tracks explicitly in library
      userId,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { spotifyTrack: { title: { contains: search, mode: "insensitive" } } },
        {
          spotifyTrack: {
            artist: { name: { contains: search, mode: "insensitive" } },
          },
        },
        {
          spotifyTrack: {
            album: { name: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    // Add tag filter
    if (tagIds && tagIds.length > 0) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }

    // Add rating filter
    if (minRating) {
      where.rating = { gte: minRating };
    }

    // Add unrated filter
    if (unratedOnly) {
      where.rating = null;
    }

    // Add source type filter
    if (sourceTypes && sourceTypes.length > 0) {
      where.sources = { some: { sourceType: { in: sourceTypes } } };
    }

    // Add genre filter
    if (genres && genres.length > 0) {
      const genreFilter: Prisma.UserTrackWhereInput = {
        spotifyTrack: { artist: { genres: { hasSome: genres } } },
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

    // Build orderBy clause with multi-level sort for deterministic ordering
    // MUST match the orderBy in getTracksForPlay() to ensure consistency
    let orderBy: Prisma.UserTrackOrderByWithRelationInput[] = [];
    switch (sortBy) {
      case "addedAt":
        orderBy = [
          { addedAt: sortOrder },
          { spotifyTrack: { album: { name: "asc" } } },
          { spotifyTrack: { trackNumber: "asc" } },
          { id: "asc" },
        ];
        break;
      case "album":
        orderBy = [
          { spotifyTrack: { album: { name: sortOrder } } },
          { spotifyTrack: { trackNumber: "asc" } },
          { id: "asc" },
        ];
        break;
      case "artist":
        orderBy = [
          { spotifyTrack: { artist: { name: sortOrder } } },
          { spotifyTrack: { album: { name: "asc" } } },
          { spotifyTrack: { trackNumber: "asc" } },
          { id: "asc" },
        ];
        break;
      case "duration":
        orderBy = [{ spotifyTrack: { duration: sortOrder } }, { id: "asc" }];
        break;
      case "lastPlayedAt":
        orderBy = [{ lastPlayedAt: sortOrder }, { id: "asc" }];
        break;
      case "rating":
        // NULLS LAST behavior will be applied below
        orderBy = [{ rating: sortOrder }, { addedAt: "desc" }, { id: "asc" }];
        break;
      case "title":
        orderBy = [{ spotifyTrack: { title: sortOrder } }, { id: "asc" }];
        break;
      case "totalPlayCount":
        orderBy = [
          { totalPlayCount: sortOrder },
          { lastPlayedAt: "desc" },
          { id: "asc" },
        ];
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // For rating and lastPlayedAt, we need NULLS LAST behavior
    // Prisma doesn't support this, so use Kysely for these sorts
    if (sortBy === "rating" || sortBy === "lastPlayedAt") {
      return this.getUserTracksWithKysely(
        userId,
        {
          genres,
          minRating,
          page,
          pageSize,
          search,
          sortBy,
          sortOrder,
          sourceTypes,
          tagIds,
          unratedOnly,
        },
        skip,
      );
    }

    // Execute queries with Prisma for other sort fields
    const [tracks, total] = await Promise.all([
      this.databaseService.userTrack.findMany({
        include: {
          sources: true,
          spotifyTrack: {
            include: { album: { include: { artist: true } }, artist: true },
          },
          tags: { include: { tag: true } },
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
        albumId: track.spotifyTrack.albumId,
        artist: track.spotifyTrack.artist.name,
        artistGenres: track.spotifyTrack.artist.genres,
        artistId: track.spotifyTrack.artistId,
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
      { page, pageSize, total, totalPages, tracks: trackDtos },
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
      throw new Error("Track not found");
    }

    const updated = await this.databaseService.userTrack.update({
      data: { ratedAt: new Date(), rating },
      where: { id: trackId },
    });

    // Update aggregated stats
    await this.aggregationService.updateStatsForTrack(
      userId,
      track.spotifyTrackId,
    );

    return updated.rating;
  }

  /**
   * Ensures a TrackSource exists for the given track and source type.
   * Creates it if it doesn't exist, otherwise does nothing.
   */
  private async ensureTrackSource(
    userTrackId: string,
    sourceType: SourceType,
    sourceName?: string,
    sourceId?: string,
  ): Promise<void> {
    const existingSource = await this.databaseService.trackSource.findFirst({
      where: { sourceType, userTrackId },
    });

    if (!existingSource) {
      await this.databaseService.trackSource.create({
        data: {
          sourceId: sourceId ?? null,
          sourceName: sourceName ?? null,
          sourceType,
          userTrackId,
        },
      });
    }
  }

  private async getUserTracksWithKysely(
    userId: string,
    query: GetTracksQueryDto,
    skip: number,
  ): Promise<PaginatedTracksDto> {
    const { page = 1, pageSize = 20, sortBy, sortOrder = "desc" } = query;

    const db = this.kyselyService.database;

    // Build base query with all joins
    let baseQuery = db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .leftJoin("TrackTag as tt", "tt.userTrackId", "ut.id")
      .leftJoin("Tag as t", "tt.tagId", "t.id")
      .leftJoin("TrackSource as ts", "ut.id", "ts.userTrackId")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true); // Only show tracks explicitly in library

    // Apply search filter
    if (query.search) {
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("st.title", "ilike", `%${query.search}%`),
          eb("sar.name", "ilike", `%${query.search}%`),
          eb("sa.name", "ilike", `%${query.search}%`),
        ]),
      );
    }

    // Apply genre filter
    if (query.genres && query.genres.length > 0) {
      baseQuery = baseQuery.where(({ eb }) =>
        eb(
          sql`sar.genres && ARRAY[${sql.join(query.genres.map((g) => sql.lit(g)))}]::text[]`,
          "=",
          sql`true`,
        ),
      );
    }

    // Apply rating filter
    if (query.minRating) {
      baseQuery = baseQuery.where("ut.rating", ">=", query.minRating);
    }

    // Apply unrated filter
    if (query.unratedOnly) {
      baseQuery = baseQuery.where("ut.rating", "is", null);
    }

    // Apply tag filter (if any tags, track must have at least one)
    if (query.tagIds && query.tagIds.length > 0) {
      baseQuery = baseQuery.where("tt.tagId", "in", query.tagIds);
    }

    // Apply source type filter
    if (query.sourceTypes && query.sourceTypes.length > 0) {
      baseQuery = baseQuery.where("ts.sourceType", "in", query.sourceTypes);
    }

    // Get total count (use DISTINCT to handle joins that create duplicates)
    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>("ut.id").distinct().as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    // Build query with aggregations
    let tracksQuery = baseQuery
      .select([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name as albumName",
        "sa.imageUrl as albumImageUrl",
        "sar.name as artistName",
        "sar.genres as artistGenres",
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
          )`.as("tags"),
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
          )`.as("sources"),
      ])
      .groupBy([
        "ut.id",
        "ut.addedAt",
        "ut.lastPlayedAt",
        "ut.totalPlayCount",
        "ut.rating",
        "ut.ratedAt",
        "st.spotifyId",
        "st.title",
        "st.duration",
        "st.albumId",
        "st.artistId",
        "sa.name",
        "sa.imageUrl",
        "sar.name",
        "sar.genres",
      ]);

    // Apply ordering with NULLS LAST for nullable fields
    // MUST match the orderBy in getTracksForPlay() to ensure consistency
    if (sortBy === "rating") {
      tracksQuery = tracksQuery
        .orderBy(
          sql`ut.rating ${sql.raw(sortOrder === "asc" ? "ASC" : "DESC")} NULLS LAST`,
        )
        .orderBy("ut.addedAt", "desc")
        .orderBy("ut.id", "asc");
    } else if (sortBy === "lastPlayedAt") {
      tracksQuery = tracksQuery
        .orderBy(
          sql`ut."lastPlayedAt" ${sql.raw(sortOrder === "asc" ? "ASC" : "DESC")} NULLS LAST`,
        )
        .orderBy("ut.id", "asc");
    }

    // Apply pagination
    const tracks = await tracksQuery.limit(pageSize).offset(skip).execute();

    // Transform to DTOs
    const trackDtos = tracks.map((track) => {
      const dto = {
        addedAt: track.addedAt,
        album: track.albumName,
        albumArt: track.albumImageUrl,
        albumId: track.albumId,
        artist: track.artistName,
        artistGenres: track.artistGenres,
        artistId: track.artistId,
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

    const totalPages = Math.ceil(total / pageSize);

    return plainToInstance(
      PaginatedTracksDto,
      { page, pageSize, total, totalPages, tracks: trackDtos },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Resolve track IDs from either explicit trackIds or filter
   */
  private async resolveTrackIds(
    userId: string,
    request: {
      excludeTrackIds?: string[];
      filter?: BulkOperationFilterDto;
      trackIds?: string[];
    },
  ): Promise<string[]> {
    if (request.trackIds && request.trackIds.length > 0) {
      // Verify all track IDs belong to the user
      const validTracks = await this.databaseService.userTrack.findMany({
        select: { id: true },
        where: { addedToLibrary: true, id: { in: request.trackIds }, userId },
      });
      return validTracks.map((t) => t.id);
    }

    if (request.filter) {
      const trackIds = await this.getTrackIdsByFilter(userId, request.filter);

      // Apply exclusions if provided (for "select all except" functionality)
      if (request.excludeTrackIds && request.excludeTrackIds.length > 0) {
        const excludeSet = new Set(request.excludeTrackIds);
        return trackIds.filter((id) => !excludeSet.has(id));
      }

      return trackIds;
    }

    throw new BadRequestException("Either trackIds or filter must be provided");
  }
}
