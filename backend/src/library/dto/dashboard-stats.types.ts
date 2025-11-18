import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class RatingStatsDto {
  @ApiProperty({ description: "Average rating across all rated tracks" })
  @Expose()
  averageRating: number;

  @ApiProperty({ description: "Percentage of library rated (0-100)" })
  @Expose()
  percentageRated: number;

  @ApiProperty({ description: "Number of rated tracks" })
  @Expose()
  ratedTracks: number;

  @ApiProperty({ description: "Total number of tracks in library" })
  @Expose()
  totalTracks: number;

  @ApiProperty({ description: "Number of unrated tracks" })
  @Expose()
  unratedTracks: number;
}
export class TopItemDto {
  @ApiProperty({ description: "Item count (play count or track count)" })
  @Expose()
  count: number;

  @ApiProperty({ description: "Internal track/artist ID", required: false })
  @Expose()
  id?: string;

  @ApiProperty({
    description: "Image URL (album art or artist image)",
    required: false,
  })
  @Expose()
  imageUrl?: string;

  @ApiProperty({
    description: "Additional info (artist name for tracks, genre for artists)",
    required: false,
  })
  @Expose()
  info?: string;

  @ApiProperty({ description: "Item name (track title or artist name)" })
  @Expose()
  name: string;

  @ApiProperty({ description: "Spotify ID", required: false })
  @Expose()
  spotifyId?: string;
}

export class TagStatsDto {
  @ApiProperty({ description: "Percentage of library tagged (0-100)" })
  @Expose()
  percentageTagged: number;

  @ApiProperty({ description: "Number of tracks with at least one tag" })
  @Expose()
  taggedTracks: number;

  @ApiProperty({ description: "Top 5 most used tags", type: [TopItemDto] })
  @Expose()
  topTags: TopItemDto[];

  @ApiProperty({ description: "Total number of tags created" })
  @Expose()
  totalTags: number;
}

