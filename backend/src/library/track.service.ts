import { Injectable, Logger } from "@nestjs/common";
import { Prisma, SourceType } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { sql } from "kysely";

import { DatabaseService } from "../database/database.service";
import { KyselyService } from "../database/kysely/kysely.service";
import { AggregationService } from "./aggregation.service";
import { AlbumDto, PaginatedAlbumsDto } from "./dto/album.dto";
import { ArtistDto, PaginatedArtistsDto } from "./dto/artist.dto";
import {
  GetPlayHistoryQueryDto,
  PaginatedPlayHistoryDto,
  PlayHistoryItemDto,
} from "./dto/play-history.dto";
import {
  GetTracksQueryDto,
  PaginatedTracksDto,
  TrackDto,
} from "./dto/track.dto";
import { SpotifyService } from "./spotify.service";

// Interfaces removed - using direct database queries with UserAlbum and UserArtist models

@Injectable()
export class TrackService {
  private readonly logger = new Logger(TrackService.name);

  constructor(
    private databaseService: DatabaseService,
    private kyselyService: KyselyService,
    private spotifyService: SpotifyService,
    private aggregationService: AggregationService,
  ) {}

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
          .innerJoin("TrackTag as tt", "ut.id", "tt.userTrackId")
          .where("tt.tagId", "in", tagCondition.tagId.in);
      }
    }

    // Apply rating filter
    if (
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

  /**
   * Helper method to fetch tracks for playback with random order
   * Used when shuffle is true to get truly random tracks from entire library
   */
  async fetchTracksForPlayWithRandomOrder(
    userId: string,
    where: Prisma.UserTrackWhereInput,
    maxTracks: number,
  ): Promise<string[]> {
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
          .innerJoin("TrackTag as tt", "ut.id", "tt.userTrackId")
          .where("tt.tagId", "in", tagCondition.tagId.in);
      }
    }

    // Apply rating filter
    if (
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

    // Use PostgreSQL's RANDOM() for true random sampling
    query = query.orderBy(sql`RANDOM()`).limit(maxTracks);

    const tracks = await query.execute();

    const spotifyUris = tracks
      .filter((track) => track.spotifyId)
      .map((track) => `spotify:track:${track.spotifyId}`);

    this.logger.log(
      `Fetched ${spotifyUris.length} randomly ordered tracks for shuffle`,
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
      .leftJoin("TrackTag as tt", "ut.id", "tt.userTrackId")
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
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .leftJoin("TrackTag as tt", "ut.id", "tt.userTrackId")
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

  async getPlayHistory(
    userId: string,
    query: GetPlayHistoryQueryDto,
  ): Promise<PaginatedPlayHistoryDto> {
    const { page = 1, pageSize = 50, search, trackId } = query;

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

  async getTracksForPlay(
    userId: string,
    query: GetTracksQueryDto & { shouldShuffle?: boolean; skip?: number },
  ): Promise<string[]> {
    const { shouldShuffle, skip = 0, ...trackQuery } = query;

    // Build where clause similar to getUserTracks
    const where: Prisma.UserTrackWhereInput = { userId };

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
    const where: Prisma.UserTrackWhereInput = { userId };

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
        where,
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

  private async getUserTracksWithKysely(
    userId: string,
    query: GetTracksQueryDto,
    where: Prisma.UserTrackWhereInput,
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
      .leftJoin("TrackTag as tt", "ut.id", "tt.userTrackId")
      .leftJoin("Tag as t", "tt.tagId", "t.id")
      .leftJoin("TrackSource as ts", "ut.id", "ts.userTrackId")
      .where("ut.userId", "=", userId);

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

    const totalPages = Math.ceil(total / pageSize);

    return plainToInstance(
      PaginatedTracksDto,
      { page, pageSize, total, totalPages, tracks: trackDtos },
      { excludeExtraneousValues: true },
    );
  }
}
