import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class GetPlayHistoryQueryDto {
  @ApiPropertyOptional({
    default: true,
    description: "Include non-library tracks (auto-tracked from play history)",
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  includeNonLibrary?: boolean = true;

  @ApiPropertyOptional({ default: 1, description: "Page number", minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 50,
    description: "Page size",
    maximum: 1000,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(1000)
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 50;

  @ApiPropertyOptional({
    description: "Search query for title, artist or album",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by track ID" })
  @IsOptional()
  @IsString()
  trackId?: string;
}

export class PaginatedPlayHistoryDto {
  @ApiProperty({ type: () => [PlayHistoryItemDto] })
  @Expose()
  @Type(() => PlayHistoryItemDto)
  items: PlayHistoryItemDto[];

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
}

export class PlayHistoryItemDto {
  @ApiPropertyOptional({
    description: "Duration listened in milliseconds",
    nullable: true,
  })
  @Expose()
  duration?: number;

  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  playedAt: Date;

  @ApiPropertyOptional({ description: "User rating (0.5-5)", nullable: true })
  @Expose()
  rating?: number;

  @ApiProperty({
    description: "Tags associated with this track",
    type: () => [PlayHistoryTagDto],
  })
  @Expose()
  @Type(() => PlayHistoryTagDto)
  tags: PlayHistoryTagDto[];

  @ApiProperty({
    description: "Whether the track is explicitly in the user's library",
  })
  @Expose()
  trackAddedToLibrary: boolean;

  @ApiPropertyOptional()
  @Expose()
  trackAlbum?: string;

  @ApiPropertyOptional()
  @Expose()
  trackAlbumArt?: string;

  @ApiProperty()
  @Expose()
  trackArtist: string;

  @ApiProperty({ description: "Track duration in milliseconds" })
  @Expose()
  trackDuration: number;

  // Track information
  @ApiProperty()
  @Expose()
  trackId: string;

  @ApiProperty()
  @Expose()
  trackSpotifyId: string;

  @ApiProperty()
  @Expose()
  trackTitle: string;
}

export class PlayHistoryTagDto {
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
