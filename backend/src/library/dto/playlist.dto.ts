import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PaginatedPlaylistsDto {
  @ApiProperty({ description: "Current page number" })
  @Expose()
  page: number;

  @ApiProperty({ description: "Number of items per page" })
  @Expose()
  pageSize: number;

  @ApiProperty({ description: "List of playlists", type: () => [PlaylistDto] })
  @Expose()
  playlists: PlaylistDto[];

  @ApiProperty({ description: "Total number of playlists" })
  @Expose()
  total: number;

  @ApiProperty({ description: "Total number of pages" })
  @Expose()
  totalPages: number;
}

export class PlaylistDto {
  @ApiProperty({
    description: "Average rating of rated tracks",
    nullable: true,
  })
  @Expose()
  avgRating: null | number;

  @ApiProperty({ description: "Whether this is a collaborative playlist" })
  @Expose()
  collaborative: boolean;

  @ApiProperty({ description: "Playlist description", nullable: true })
  @Expose()
  description: null | string;

  @ApiProperty({ description: "Playlist internal ID" })
  @Expose()
  id: string;

  @ApiProperty({ description: "Playlist cover image URL", nullable: true })
  @Expose()
  imageUrl: null | string;

  @ApiProperty({
    description: "Date when any track from playlist was last played",
    nullable: true,
  })
  @Expose()
  lastPlayed: Date | null;

  @ApiProperty({ description: "Playlist name" })
  @Expose()
  name: string;

  @ApiProperty({ description: "Playlist owner name", nullable: true })
  @Expose()
  ownerName: null | string;

  @ApiProperty({ description: "Whether this is a public playlist" })
  @Expose()
  public: boolean;

  @ApiProperty({ description: "Spotify playlist ID" })
  @Expose()
  spotifyId: string;

  @ApiProperty({ description: "Total duration of all tracks in milliseconds" })
  @Expose()
  totalDuration: number;

  @ApiProperty({ description: "Total play count across all tracks" })
  @Expose()
  totalPlayCount: number;

  @ApiProperty({ description: "Number of tracks in playlist" })
  @Expose()
  trackCount: number;
}
