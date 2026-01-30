import { Injectable, Logger } from "@nestjs/common";
import { sql } from "kysely";

import { KyselyService } from "../database/kysely/kysely.service";
import {
  AudioProfileDto,
  EnrichmentProgressDto,
  GenreDistributionDto,
  LibraryInsightsDto,
  TopArtistDto,
  YearDistributionDto,
} from "./dto/library-insights.dto";

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(private kyselyService: KyselyService) {}

  async getLibraryInsights(userId: string): Promise<LibraryInsightsDto> {
    this.logger.log(`Getting library insights for user ${userId}`);

    // Run queries in parallel for better performance
    const [
      basicStats,
      topArtists,
      enrichmentProgress,
      genreDistribution,
      audioProfile,
      yearDistribution,
    ] = await Promise.all([
      this.getBasicStats(userId),
      this.getTopArtists(userId),
      this.getEnrichmentProgress(userId),
      this.getGenreDistribution(userId),
      this.getAudioProfile(userId),
      this.getYearDistribution(userId),
    ]);

    return {
      audioProfile,
      enrichmentProgress,
      genreDistribution,
      newestTrackYear: basicStats.newestTrackYear,
      oldestTrackYear: basicStats.oldestTrackYear,
      topArtists,
      totalAlbums: basicStats.totalAlbums,
      totalArtists: basicStats.totalArtists,
      totalTracks: basicStats.totalTracks,
      yearDistribution,
    };
  }

  private async getAudioProfile(userId: string): Promise<AudioProfileDto> {
    const db = this.kyselyService.database;

    const result = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .where("st.audioFeaturesUpdatedAt", "is not", null)
      .select([
        // Energy distribution
        sql<number>`COUNT(*) FILTER (WHERE st.energy < 0.33)::int`.as(
          "energyLow",
        ),
        sql<number>`COUNT(*) FILTER (WHERE st.energy >= 0.33 AND st.energy < 0.66)::int`.as(
          "energyMedium",
        ),
        sql<number>`COUNT(*) FILTER (WHERE st.energy >= 0.66)::int`.as(
          "energyHigh",
        ),
        // Valence distribution
        sql<number>`COUNT(*) FILTER (WHERE st.valence < 0.33)::int`.as(
          "valenceLow",
        ),
        sql<number>`COUNT(*) FILTER (WHERE st.valence >= 0.33 AND st.valence < 0.66)::int`.as(
          "valenceMedium",
        ),
        sql<number>`COUNT(*) FILTER (WHERE st.valence >= 0.66)::int`.as(
          "valenceHigh",
        ),
        // Tempo distribution
        sql<number>`COUNT(*) FILTER (WHERE st.tempo < 100)::int`.as(
          "tempoSlow",
        ),
        sql<number>`COUNT(*) FILTER (WHERE st.tempo >= 100 AND st.tempo < 130)::int`.as(
          "tempoMedium",
        ),
        sql<number>`COUNT(*) FILTER (WHERE st.tempo >= 130)::int`.as(
          "tempoFast",
        ),
        // Averages
        sql<number>`ROUND(AVG(st.energy)::numeric, 2)`.as("averageEnergy"),
        sql<number>`ROUND(AVG(st.valence)::numeric, 2)`.as("averageValence"),
        sql<number>`ROUND(AVG(st.tempo)::numeric, 0)`.as("averageTempo"),
      ])
      .executeTakeFirst();

    return {
      averageEnergy: result?.averageEnergy ?? 0,
      averageTempo: result?.averageTempo ?? 0,
      averageValence: result?.averageValence ?? 0,
      energyDistribution: {
        high: result?.energyHigh ?? 0,
        low: result?.energyLow ?? 0,
        medium: result?.energyMedium ?? 0,
      },
      tempoDistribution: {
        fast: result?.tempoFast ?? 0,
        medium: result?.tempoMedium ?? 0,
        slow: result?.tempoSlow ?? 0,
      },
      valenceDistribution: {
        high: result?.valenceHigh ?? 0,
        low: result?.valenceLow ?? 0,
        medium: result?.valenceMedium ?? 0,
      },
    };
  }

  private async getBasicStats(
    userId: string,
  ): Promise<{
    newestTrackYear: null | number;
    oldestTrackYear: null | number;
    totalAlbums: number;
    totalArtists: number;
    totalTracks: number;
  }> {
    const db = this.kyselyService.database;

    const result = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .select([
        sql<number>`COUNT(DISTINCT ut.id)::int`.as("totalTracks"),
        sql<number>`COUNT(DISTINCT sa.id)::int`.as("totalAlbums"),
        sql<number>`COUNT(DISTINCT st."artistId")::int`.as("totalArtists"),
        sql<number>`MIN(EXTRACT(YEAR FROM sa."releaseDate"))::int`.as(
          "oldestTrackYear",
        ),
        sql<number>`MAX(EXTRACT(YEAR FROM sa."releaseDate"))::int`.as(
          "newestTrackYear",
        ),
      ])
      .executeTakeFirst();

    return {
      newestTrackYear: result?.newestTrackYear ?? null,
      oldestTrackYear: result?.oldestTrackYear ?? null,
      totalAlbums: result?.totalAlbums ?? 0,
      totalArtists: result?.totalArtists ?? 0,
      totalTracks: result?.totalTracks ?? 0,
    };
  }

  private async getEnrichmentProgress(
    userId: string,
  ): Promise<EnrichmentProgressDto> {
    const db = this.kyselyService.database;

    const result = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .select([
        sql<number>`COUNT(*)::int`.as("totalTracks"),
        sql<number>`COUNT(*) FILTER (WHERE st."audioFeaturesUpdatedAt" IS NOT NULL)::int`.as(
          "tracksWithAudioFeatures",
        ),
        sql<number>`COUNT(*) FILTER (WHERE st."genresUpdatedAt" IS NOT NULL)::int`.as(
          "tracksWithGenres",
        ),
      ])
      .executeTakeFirst();

    return {
      totalTracks: result?.totalTracks ?? 0,
      tracksWithAudioFeatures: result?.tracksWithAudioFeatures ?? 0,
      tracksWithGenres: result?.tracksWithGenres ?? 0,
    };
  }

  private async getGenreDistribution(
    userId: string,
    limit = 15,
  ): Promise<GenreDistributionDto[]> {
    const db = this.kyselyService.database;

    // First get total tracks for percentage calculation
    const totalResult = await db
      .selectFrom("UserTrack as ut")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .select(sql<number>`COUNT(*)::int`.as("total"))
      .executeTakeFirst();

    const totalTracks = totalResult?.total ?? 0;

    if (totalTracks === 0) {
      return [];
    }

    const results = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("TrackGenre as tg", "st.id", "tg.trackId")
      .innerJoin("Genre as g", "tg.genreId", "g.id")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .groupBy(["g.name", "g.displayName"])
      .select([
        "g.name as genre",
        "g.displayName",
        sql<number>`COUNT(DISTINCT ut.id)::int`.as("count"),
      ])
      .orderBy("count", "desc")
      .limit(limit)
      .execute();

    return results.map((r) => ({
      count: r.count,
      displayName: r.displayName,
      genre: r.genre,
      percentage: Math.round((r.count / totalTracks) * 100 * 10) / 10,
    }));
  }

  private async getTopArtists(
    userId: string,
    limit = 10,
  ): Promise<TopArtistDto[]> {
    const db = this.kyselyService.database;

    const results = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyArtist as sar", "st.artistId", "sar.id")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .groupBy(["sar.id", "sar.name", "sar.imageUrl"])
      .select([
        "sar.name",
        "sar.imageUrl",
        sql<number>`COUNT(DISTINCT ut.id)::int`.as("trackCount"),
      ])
      .orderBy("trackCount", "desc")
      .limit(limit)
      .execute();

    return results.map((r) => ({
      imageUrl: r.imageUrl ?? undefined,
      name: r.name,
      trackCount: r.trackCount,
    }));
  }

  private async getYearDistribution(
    userId: string,
  ): Promise<YearDistributionDto[]> {
    const db = this.kyselyService.database;

    // First get total tracks for percentage calculation
    const totalResult = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .where("sa.releaseDate", "is not", null)
      .select(sql<number>`COUNT(*)::int`.as("total"))
      .executeTakeFirst();

    const totalTracks = totalResult?.total ?? 0;

    if (totalTracks === 0) {
      return [];
    }

    const results = await db
      .selectFrom("UserTrack as ut")
      .innerJoin("SpotifyTrack as st", "ut.spotifyTrackId", "st.id")
      .innerJoin("SpotifyAlbum as sa", "st.albumId", "sa.id")
      .where("ut.userId", "=", userId)
      .where("ut.addedToLibrary", "=", true)
      .where("sa.releaseDate", "is not", null)
      .select([
        sql<number>`EXTRACT(YEAR FROM sa."releaseDate")::int`.as("year"),
        sql<number>`COUNT(*)::int`.as("count"),
      ])
      .groupBy(sql`EXTRACT(YEAR FROM sa."releaseDate")`)
      .orderBy("year", "asc")
      .execute();

    return results.map((r) => ({
      count: r.count,
      percentage: Math.round((r.count / totalTracks) * 100 * 10) / 10,
      year: r.year,
    }));
  }
}
