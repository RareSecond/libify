import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SourceType } from "@prisma/client";
import { Expose, Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class BulkOperationFilterDto {
  @ApiPropertyOptional({ description: "Filter by album ID (internal)" })
  @IsOptional()
  @IsUUID()
  albumId?: string;

  @ApiPropertyOptional({ description: "Filter by artist ID (internal)" })
  @IsOptional()
  @IsUUID()
  artistId?: string;

  @ApiPropertyOptional({
    description: "Filter by artist genres",
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({
    description: "Filter by minimum rating",
    maximum: 5,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Max(5)
  @Min(1)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ description: "Filter by smart playlist ID" })
  @IsOptional()
  @IsUUID()
  playlistId?: string;

  @ApiPropertyOptional({ description: "Search query for title, artist, album" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by source types",
    enum: SourceType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(SourceType, { each: true })
  @IsOptional()
  sourceTypes?: SourceType[];

  @ApiPropertyOptional({ description: "Filter by Spotify playlist ID" })
  @IsOptional()
  @IsString()
  spotifyPlaylistId?: string;

  @ApiPropertyOptional({ description: "Filter by tag IDs", type: [String] })
  @IsArray()
  @IsOptional()
  @IsUUID("4", { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: "Filter for unrated tracks only" })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  unratedOnly?: boolean;
}

export class BulkOperationResponseDto {
  @ApiProperty({ description: "Number of tracks affected" })
  @Expose()
  affectedCount: number;

  @ApiProperty({ description: "Result message" })
  @Expose()
  message: string;
}

export class BulkRatingRequestDto {
  @ApiPropertyOptional({
    description:
      "Track IDs to exclude when using filter (for 'select all except' functionality)",
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID("4", { each: true })
  excludeTrackIds?: string[];

  @ApiPropertyOptional({
    description: "Filter criteria for tracks to rate (alternative to trackIds)",
    type: BulkOperationFilterDto,
  })
  @IsOptional()
  @Type(() => BulkOperationFilterDto)
  @ValidateNested()
  filter?: BulkOperationFilterDto;

  @ApiPropertyOptional({
    default: false,
    description:
      "Whether to overwrite existing ratings (false = only rate unrated tracks)",
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  overwriteExisting?: boolean;

  @ApiProperty({
    description: "Rating value (0.5-5 in 0.5 increments)",
    example: 4.5,
    maximum: 5,
    minimum: 0.5,
  })
  @IsNumber()
  @Max(5)
  @Min(0.5)
  @Transform(({ value }) => {
    // Round to nearest 0.5
    return Math.round(value * 2) / 2;
  })
  rating: number;

  @ApiPropertyOptional({
    description: "Explicit track IDs to rate (alternative to filter)",
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID("4", { each: true })
  trackIds?: string[];
}

export class BulkTagRequestDto {
  @ApiProperty({ description: "Action to perform", enum: ["add", "remove"] })
  @IsEnum(["add", "remove"])
  action: "add" | "remove";

  @ApiPropertyOptional({
    description:
      "Track IDs to exclude when using filter (for 'select all except' functionality)",
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID("4", { each: true })
  excludeTrackIds?: string[];

  @ApiPropertyOptional({
    description: "Filter criteria for tracks to tag (alternative to trackIds)",
    type: BulkOperationFilterDto,
  })
  @IsOptional()
  @Type(() => BulkOperationFilterDto)
  @ValidateNested()
  filter?: BulkOperationFilterDto;

  @ApiProperty({ description: "Tag ID to add or remove" })
  @IsUUID()
  tagId: string;

  @ApiPropertyOptional({
    description: "Explicit track IDs to tag (alternative to filter)",
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsUUID("4", { each: true })
  trackIds?: string[];
}
