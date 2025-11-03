import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class AlbumDto {
  @ApiProperty({ description: "Album artwork URL", nullable: true })
  @Expose()
  albumArt: null | string;

  @ApiProperty({ description: "Album artist" })
  @Expose()
  artist: string;

  @ApiProperty({
    description: "Array of genre names from the album artist",
    nullable: true,
    type: [String],
  })
  @Expose()
  artistGenres: string[];

  @ApiProperty({
    description: "Average rating of rated tracks",
    nullable: true,
  })
  @Expose()
  avgRating: null | number;

  @ApiProperty({ description: "Date when first track from album was added" })
  @Expose()
  firstAdded: Date;

  @ApiProperty({
    description: "Date when any track from album was last played",
    nullable: true,
  })
  @Expose()
  lastPlayed: Date | null;

  @ApiProperty({ description: "Album name" })
  @Expose()
  name: string;

  @ApiProperty({ description: "Total duration of all tracks in milliseconds" })
  @Expose()
  totalDuration: number;

  @ApiProperty({ description: "Total play count across all tracks" })
  @Expose()
  totalPlayCount: number;

  @ApiProperty({ description: "Number of tracks from this album in library" })
  @Expose()
  trackCount: number;
}

export class PaginatedAlbumsDto {
  @ApiProperty({ description: "List of albums" })
  @Expose()
  albums: AlbumDto[];

  @ApiProperty({ description: "Current page number" })
  @Expose()
  page: number;

  @ApiProperty({ description: "Number of items per page" })
  @Expose()
  pageSize: number;

  @ApiProperty({ description: "Total number of albums" })
  @Expose()
  total: number;

  @ApiProperty({ description: "Total number of pages" })
  @Expose()
  totalPages: number;
}
