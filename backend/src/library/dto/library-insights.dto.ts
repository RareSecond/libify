import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import {
  DistributionBucketsDto,
  TempoDistributionDto,
  TopArtistDto,
} from "./insights-base.dto";

export { DistributionBucketsDto, TempoDistributionDto, TopArtistDto };

export class AudioProfileDto {
  @ApiProperty({ description: "Average energy (0-1)" })
  @Expose()
  averageEnergy: number;

  @ApiProperty({ description: "Average tempo in BPM" })
  @Expose()
  averageTempo: number;

  @ApiProperty({ description: "Average valence (0-1)" })
  @Expose()
  averageValence: number;

  @ApiProperty({
    description: "Energy distribution (low/medium/high)",
    type: DistributionBucketsDto,
  })
  @Expose()
  @Type(() => DistributionBucketsDto)
  energyDistribution: DistributionBucketsDto;

  @ApiProperty({
    description: "Tempo distribution (slow/medium/fast)",
    type: TempoDistributionDto,
  })
  @Expose()
  @Type(() => TempoDistributionDto)
  tempoDistribution: TempoDistributionDto;

  @ApiProperty({
    description: "Valence distribution (low/medium/high)",
    type: DistributionBucketsDto,
  })
  @Expose()
  @Type(() => DistributionBucketsDto)
  valenceDistribution: DistributionBucketsDto;
}

export class DecadeDistributionDto {
  @ApiProperty({ description: "Number of tracks from this decade" })
  @Expose()
  count: number;

  @ApiProperty({ description: "Decade (e.g., '1980s', '2010s')" })
  @Expose()
  decade: string;

  @ApiProperty({ description: "Percentage of total tracks" })
  @Expose()
  percentage: number;
}

export class EnrichmentProgressDto {
  @ApiProperty({ description: "Total number of tracks" })
  @Expose()
  totalTracks: number;

  @ApiProperty({ description: "Number of tracks with audio features" })
  @Expose()
  tracksWithAudioFeatures: number;

  @ApiProperty({ description: "Number of tracks with genres" })
  @Expose()
  tracksWithGenres: number;
}

export class GenreDistributionDto {
  @ApiProperty({ description: "Number of tracks in this genre" })
  @Expose()
  count: number;

  @ApiProperty({ description: "Genre display name" })
  @Expose()
  displayName: string;

  @ApiProperty({ description: "Genre name (normalized)" })
  @Expose()
  genre: string;

  @ApiProperty({ description: "Percentage of total tracks" })
  @Expose()
  percentage: number;
}

export class LibraryInsightsDto {
  @ApiProperty({
    description: "Audio profile with energy, valence, and tempo distributions",
    type: AudioProfileDto,
  })
  @Expose()
  @Type(() => AudioProfileDto)
  audioProfile: AudioProfileDto;

  @ApiProperty({
    description: "Decade distribution",
    type: [DecadeDistributionDto],
  })
  @Expose()
  @Type(() => DecadeDistributionDto)
  decadeDistribution: DecadeDistributionDto[];

  @ApiProperty({
    description: "Enrichment progress stats",
    type: EnrichmentProgressDto,
  })
  @Expose()
  @Type(() => EnrichmentProgressDto)
  enrichmentProgress: EnrichmentProgressDto;

  @ApiProperty({
    description: "Genre distribution",
    type: [GenreDistributionDto],
  })
  @Expose()
  @Type(() => GenreDistributionDto)
  genreDistribution: GenreDistributionDto[];

  @ApiProperty({
    description: "Newest track year in library",
    required: false,
    type: Number,
  })
  @Expose()
  newestTrackYear: null | number;

  @ApiProperty({
    description: "Oldest track year in library",
    required: false,
    type: Number,
  })
  @Expose()
  oldestTrackYear: null | number;

  @ApiProperty({
    description: "Top artists by track count",
    type: [TopArtistDto],
  })
  @Expose()
  @Type(() => TopArtistDto)
  topArtists: TopArtistDto[];

  @ApiProperty({ description: "Total number of albums in library" })
  @Expose()
  totalAlbums: number;

  @ApiProperty({ description: "Total number of artists in library" })
  @Expose()
  totalArtists: number;

  @ApiProperty({ description: "Total number of tracks in library" })
  @Expose()
  totalTracks: number;
}
