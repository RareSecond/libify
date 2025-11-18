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
