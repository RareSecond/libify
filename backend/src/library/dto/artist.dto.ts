import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ArtistDto {
  @ApiProperty({ description: 'Number of albums by this artist' })
  @Expose()
  albumCount: number;

  @ApiProperty({ description: 'Artist image URL', nullable: true })
  @Expose()
  artistImage: null | string;

  @ApiProperty({ description: 'Average rating across all rated tracks', nullable: true })
  @Expose()
  avgRating: null | number;

  @ApiProperty({ description: 'Date when first track was added' })
  @Expose()
  firstAdded: Date;

  @ApiProperty({ description: 'Date when any track was last played', nullable: true })
  @Expose()
  lastPlayed: Date | null;

  @ApiProperty({ description: 'Artist name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Total duration of all tracks in milliseconds' })
  @Expose()
  totalDuration: number;

  @ApiProperty({ description: 'Total play count across all tracks' })
  @Expose()
  totalPlayCount: number;

  @ApiProperty({ description: 'Number of tracks by this artist' })
  @Expose()
  trackCount: number;
}

export class PaginatedArtistsDto {
  @ApiProperty({ description: 'List of artists', type: [ArtistDto] })
  @Expose()
  artists: ArtistDto[];

  @ApiProperty({ description: 'Current page number' })
  @Expose()
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  @Expose()
  pageSize: number;

  @ApiProperty({ description: 'Total number of artists' })
  @Expose()
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  @Expose()
  totalPages: number;
}