import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import {
  RatingStatsDto,
  TagStatsDto,
  TopItemDto,
} from "./dashboard-stats.types";

export class ActivityStatsDto {
  @ApiProperty({ description: "Total play count in last 7 days" })
  @Expose()
  totalPlaysThisWeek: number;

  @ApiProperty({ description: "Number of tracks added in last 7 days" })
  @Expose()
  tracksAddedThisWeek: number;

  @ApiProperty({ description: "Number of tracks played in last 7 days" })
  @Expose()
  tracksPlayedThisWeek: number;

  @ApiProperty({ description: "Number of tracks rated in last 7 days" })
  @Expose()
  tracksRatedThisWeek: number;
}

export class DashboardStatsDto {
  @ApiProperty({
    description: "Activity statistics for the past week",
    type: ActivityStatsDto,
  })
  @Expose()
  activityStats: ActivityStatsDto;

  @ApiProperty({ description: "Whether library has been synced" })
  @Expose()
  isSynced: boolean;

  @ApiProperty({ description: "Last sync date", required: false })
  @Expose()
  lastSyncedAt?: Date;

  @ApiProperty({ description: "Rating statistics", type: RatingStatsDto })
  @Expose()
  ratingStats: RatingStatsDto;

  @ApiProperty({ description: "Tag statistics", type: TagStatsDto })
  @Expose()
  tagStats: TagStatsDto;

  @ApiProperty({
    description: "Top 3 most played artists this week",
    type: [TopItemDto],
  })
  @Expose()
  topArtistsThisWeek: TopItemDto[];

  @ApiProperty({
    description: "Top 3 most played tracks this week",
    type: [TopItemDto],
  })
  @Expose()
  topTracksThisWeek: TopItemDto[];

  @ApiProperty({ description: "Total albums in user library" })
  @Expose()
  totalAlbums: number;

  @ApiProperty({ description: "Total artists in user library" })
  @Expose()
  totalArtists: number;

  @ApiProperty({ description: "Total tracks in user library" })
  @Expose()
  totalTracks: number;
}

// Re-export types for convenience
export { RatingStatsDto, TagStatsDto, TopItemDto };
