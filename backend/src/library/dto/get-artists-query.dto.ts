import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetArtistsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by genres (artists matching any of the genres)',
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

  @ApiPropertyOptional({ default: 1, description: 'Page number', minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 24,
    description: 'Page size',
    maximum: 100,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(100)
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 24;

  @ApiPropertyOptional({
    description: 'Search query for artist name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: [
      'albumCount',
      'avgRating',
      'lastPlayed',
      'name',
      'totalPlayCount',
      'trackCount',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?:
    | 'albumCount'
    | 'avgRating'
    | 'lastPlayed'
    | 'name'
    | 'totalPlayCount'
    | 'trackCount';

  @ApiPropertyOptional({
    default: 'asc',
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
