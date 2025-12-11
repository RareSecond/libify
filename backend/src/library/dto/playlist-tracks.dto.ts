import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { TrackDto } from "./track.dto";

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
