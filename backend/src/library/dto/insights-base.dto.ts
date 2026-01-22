import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class DistributionBucketsDto {
  @ApiProperty({ description: "High bucket count" })
  @Expose()
  high: number;

  @ApiProperty({ description: "Low bucket count" })
  @Expose()
  low: number;

  @ApiProperty({ description: "Medium bucket count" })
  @Expose()
  medium: number;
}

export class TempoDistributionDto {
  @ApiProperty({ description: "Fast tempo count (> 130 BPM)" })
  @Expose()
  fast: number;

  @ApiProperty({ description: "Medium tempo count (100-130 BPM)" })
  @Expose()
  medium: number;

  @ApiProperty({ description: "Slow tempo count (< 100 BPM)" })
  @Expose()
  slow: number;
}

export class TopArtistDto {
  @ApiProperty({ description: "Artist image URL", required: false })
  @Expose()
  imageUrl?: string;

  @ApiProperty({ description: "Artist name" })
  @Expose()
  name: string;

  @ApiProperty({ description: "Number of tracks by this artist" })
  @Expose()
  trackCount: number;
}
