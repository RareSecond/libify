import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

import { TopItemDto } from "./top-item.dto";

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
