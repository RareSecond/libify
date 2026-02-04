import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SourceType } from "@prisma/client";
import { Expose, Transform, Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from "class-validator";

import { TagDto } from "./tag.dto";
import { TRACK_SORT_FIELDS, TrackSortField } from "./track-sort.constants";
import { TrackSourceDto } from "./track-source.dto";

export class GetTracksQueryDto {
  @ApiPropertyOptional({
    description: "Filter by artist genres (tracks matching any of the genres)",
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ obj, value }) => {
    // Handle genres[] format from frontend
    if (obj["genres[]"]) {
      const genresArray = obj["genres[]"];
      if (typeof genresArray === "string") {
        return [genresArray];
      }
      return genresArray;
    }
    // Handle normal genres format
    if (!value) return [];
    if (typeof value === "string") {
      return [value];
    }
    return value;
  })
  genres?: string[];

  @ApiPropertyOptional({
    description: "Filter by minimum rating",
    maximum: 5,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(5)
  @Min(1)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ default: 1, description: "Page number", minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 20,
    description: "Page size",
    maximum: 1000,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(1000)
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description: "Search query for title, artist or album",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Sort field", enum: TRACK_SORT_FIELDS })
  @IsIn(TRACK_SORT_FIELDS)
  @IsOptional()
  sortBy?: TrackSortField;

  @ApiPropertyOptional({
    default: "desc",
    description: "Sort order",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "desc";

  @ApiPropertyOptional({
    description: "Filter by source types",
    enum: SourceType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(SourceType, { each: true })
  @IsOptional()
  @Transform(({ obj, value }) => {
    // Handle sourceTypes[] format from frontend
    if (obj["sourceTypes[]"]) {
      const sourceTypesArray = obj["sourceTypes[]"];
      if (typeof sourceTypesArray === "string") {
        return [sourceTypesArray];
      }
      return sourceTypesArray;
    }
    // Handle normal sourceTypes format
    if (!value) return [];
    if (typeof value === "string") {
      return [value];
    }
    return value;
  })
  sourceTypes?: SourceType[];

  @ApiPropertyOptional({ description: "Filter by tag IDs", type: [String] })
  @IsArray()
  @IsOptional()
  @IsUUID("4", { each: true })
  @Transform(({ obj, value }) => {
    // Handle tagIds[] format from frontend
    if (obj["tagIds[]"]) {
      const tagIdsArray = obj["tagIds[]"];
      if (typeof tagIdsArray === "string") {
        return [tagIdsArray];
      }
      return tagIdsArray;
    }
    // Handle normal tagIds format
    if (!value) return [];
    if (typeof value === "string") {
      return [value];
    }
    return value;
  })
  tagIds?: string[];

  @ApiPropertyOptional({
    default: false,
    description: "Filter for unrated tracks only",
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  unratedOnly?: boolean;
}

export class PaginatedTracksDto {
  @ApiProperty()
  @Expose()
  page: number;

  @ApiProperty()
  @Expose()
  pageSize: number;

  @ApiProperty()
  @Expose()
  total: number;

  @ApiProperty()
  @Expose()
  totalPages: number;

  @ApiProperty({ type: () => [TrackDto] })
  @Expose()
  @Type(() => TrackDto)
  tracks: TrackDto[];
}

export class TrackDto {
  @ApiPropertyOptional({ description: "0.0-1.0, confidence track is acoustic" })
  @Expose()
  acousticness?: number;

  @ApiProperty()
  @Expose()
  addedAt: Date;

  @ApiPropertyOptional()
  @Expose()
  album?: string;

  @ApiPropertyOptional()
  @Expose()
  albumArt?: string;

  @ApiProperty({ description: "Internal album ID for playback context" })
  @Expose()
  albumId: string;

  @ApiProperty()
  @Expose()
  artist: string;

  @ApiProperty({
    description: "Array of genre names from the track artist",
    nullable: true,
    type: [String],
  })
  @Expose()
  artistGenres: string[];

  @ApiProperty({ description: "Internal artist ID for playback context" })
  @Expose()
  artistId: string;

  @ApiPropertyOptional({ description: "0.0-1.0, how suitable for dancing" })
  @Expose()
  danceability?: number;

  @ApiProperty({ description: "Duration in milliseconds" })
  @Expose()
  duration: number;

  @ApiPropertyOptional({
    description: "0.0-1.0, perceptual intensity/activity",
  })
  @Expose()
  energy?: number;

  @ApiProperty()
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: "0.0-1.0, predicts if track has no vocals",
  })
  @Expose()
  instrumentalness?: number;

  @ApiPropertyOptional()
  @Expose()
  lastPlayedAt?: Date;

  @ApiPropertyOptional({
    description: "0.0-1.0, probability of live recording",
  })
  @Expose()
  liveness?: number;

  @ApiPropertyOptional()
  @Expose()
  ratedAt?: Date;

  @ApiPropertyOptional({ maximum: 5, minimum: 1 })
  @Expose()
  rating?: number;

  @ApiPropertyOptional({ description: "Album release date" })
  @Expose()
  releaseDate?: Date;

  @ApiProperty({ type: [TrackSourceDto] })
  @Expose()
  @Type(() => TrackSourceDto)
  sources: TrackSourceDto[];

  @ApiPropertyOptional({ description: "0.0-1.0, presence of spoken words" })
  @Expose()
  speechiness?: number;

  @ApiProperty()
  @Expose()
  spotifyId: string;

  @ApiProperty({ type: [TagDto] })
  @Expose()
  @Type(() => TagDto)
  tags: TagDto[];

  @ApiPropertyOptional({ description: "Tempo in BPM" })
  @Expose()
  tempo?: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  totalPlayCount: number;

  @ApiPropertyOptional({
    description: "0.0-1.0, musical positiveness (happy vs sad)",
  })
  @Expose()
  valence?: number;
}
