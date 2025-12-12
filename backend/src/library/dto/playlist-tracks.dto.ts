import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import { TrackDto } from "./track.dto";

export class GetPlaylistTracksQueryDto {
  @ApiPropertyOptional({ default: 1, description: "Page number", minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 20,
    description: "Number of tracks per page",
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
    description: "Sort field",
    enum: [
      "title",
      "artist",
      "album",
      "addedAt",
      "lastPlayedAt",
      "totalPlayCount",
      "rating",
      "duration",
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?:
    | "addedAt"
    | "album"
    | "artist"
    | "duration"
    | "lastPlayedAt"
    | "rating"
    | "title"
    | "totalPlayCount";

  @ApiPropertyOptional({
    default: "desc",
    description: "Sort order",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";
}

export class PlaylistTracksResponseDto {
  @ApiProperty({ description: "Playlist description", nullable: true })
  @Expose()
  description: null | string;

  @ApiProperty({ description: "Playlist cover image URL", nullable: true })
  @Expose()
  imageUrl: null | string;

  @ApiProperty({ description: "Playlist name" })
  @Expose()
  name: string;

  @ApiProperty({ description: "Current page number" })
  @Expose()
  page: number;

  @ApiProperty({ description: "Number of items per page" })
  @Expose()
  pageSize: number;

  @ApiProperty({ description: "Spotify playlist ID" })
  @Expose()
  spotifyId: string;

  @ApiProperty({ description: "Total number of tracks" })
  @Expose()
  total: number;

  @ApiProperty({ description: "Total number of pages" })
  @Expose()
  totalPages: number;

  @ApiProperty({ isArray: true, type: TrackDto })
  @Expose()
  @Type(() => TrackDto)
  tracks: TrackDto[];
}
