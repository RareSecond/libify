import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

import { TrackDto } from "./track.dto";

export class PlaylistTracksResponseDto {
  @ApiProperty({ description: "Playlist description", nullable: true })
  description: null | string;

  @ApiProperty({ description: "Playlist cover image URL", nullable: true })
  imageUrl: null | string;

  @ApiProperty({ description: "Playlist name" })
  name: string;

  @ApiProperty({ description: "Current page number" })
  page: number;

  @ApiProperty({ description: "Number of items per page" })
  pageSize: number;

  @ApiProperty({ description: "Spotify playlist ID" })
  spotifyId: string;

  @ApiProperty({ description: "Total number of tracks" })
  total: number;

  @ApiProperty({ description: "Total number of pages" })
  totalPages: number;

  @ApiProperty({ isArray: true, type: TrackDto })
  @Type(() => TrackDto)
  tracks: TrackDto[];
}
