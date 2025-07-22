import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class GetTracksQueryDto {
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
    maximum: 100,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(100)
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

  @ApiPropertyOptional({ description: 'Filter by tag IDs', type: [String] })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
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

export class TagDto {
  @ApiPropertyOptional()
  @Expose()
  color?: string;

  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
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
