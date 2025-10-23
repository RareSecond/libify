import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { TagDto } from './tag.dto';
import { TrackSourceDto } from './track-source.dto';

export class GetTracksQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by artist genres (tracks matching any of the genres)',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ obj, value }) => {
    // Handle genres[] format from frontend
    if (obj['genres[]']) {
      const genresArray = obj['genres[]'];
      if (typeof genresArray === 'string') {
        return [genresArray];
      }
      return genresArray;
    }
    // Handle normal genres format
    if (!value) return [];
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  genres?: string[];

  @ApiPropertyOptional({
    description: 'Filter by minimum rating',
    maximum: 5,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(5)
  @Min(1)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ default: 1, description: 'Page number', minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 20,
    description: 'Page size',
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
    description: 'Search query for title, artist or album',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: [
      'title',
      'artist',
      'album',
      'addedAt',
      'lastPlayedAt',
      'totalPlayCount',
      'rating',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?:
    | 'addedAt'
    | 'album'
    | 'artist'
    | 'lastPlayedAt'
    | 'rating'
    | 'title'
    | 'totalPlayCount';

  @ApiPropertyOptional({
    default: 'desc',
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by source types',
    enum: SourceType,
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ obj, value }) => {
    // Handle sourceTypes[] format from frontend
    if (obj['sourceTypes[]']) {
      const sourceTypesArray = obj['sourceTypes[]'];
      if (typeof sourceTypesArray === 'string') {
        return [sourceTypesArray];
      }
      return sourceTypesArray;
    }
    // Handle normal sourceTypes format
    if (!value) return [];
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  sourceTypes?: string[];

  @ApiPropertyOptional({ description: 'Filter by tag IDs', type: [String] })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  @Transform(({ obj, value }) => {
    // Handle tagIds[] format from frontend
    if (obj['tagIds[]']) {
      const tagIdsArray = obj['tagIds[]'];
      if (typeof tagIdsArray === 'string') {
        return [tagIdsArray];
      }
      return tagIdsArray;
    }
    // Handle normal tagIds format
    if (!value) return [];
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  tagIds?: string[];
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
  @ApiProperty()
  @Expose()
  addedAt: Date;

  @ApiPropertyOptional()
  @Expose()
  album?: string;

  @ApiPropertyOptional()
  @Expose()
  albumArt?: string;

  @ApiProperty()
  @Expose()
  artist: string;

  @ApiProperty({
    description: 'Array of genre names from the track artist',
    nullable: true,
    type: [String],
  })
  @Expose()
  artistGenres: string[];

  @ApiProperty({ description: 'Duration in milliseconds' })
  @Expose()
  duration: number;

  @ApiProperty()
  @Expose()
  id: string;

  @ApiPropertyOptional()
  @Expose()
  lastPlayedAt?: Date;

  @ApiPropertyOptional()
  @Expose()
  ratedAt?: Date;

  @ApiPropertyOptional({ maximum: 5, minimum: 1 })
  @Expose()
  rating?: number;

  @ApiProperty({ type: [TrackSourceDto] })
  @Expose()
  @Type(() => TrackSourceDto)
  sources: TrackSourceDto[];

  @ApiProperty()
  @Expose()
  spotifyId: string;

  @ApiProperty({ type: [TagDto] })
  @Expose()
  @Type(() => TagDto)
  tags: TagDto[];

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  totalPlayCount: number;
}
