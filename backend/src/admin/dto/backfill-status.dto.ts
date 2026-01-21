import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class BackfillStatusDto {
  @ApiProperty({ description: "Number of tracks already processed" })
  @Expose()
  completed: number;

  @ApiProperty({ description: "Number of tracks pending processing" })
  @Expose()
  pending: number;

  @ApiProperty({ description: "Percentage complete" })
  @Expose()
  percentComplete: number;

  @ApiProperty({ description: "Total number of tracks" })
  @Expose()
  total: number;
}

export class BackfillTriggerResponseDto {
  @ApiProperty({ description: "Job ID if applicable", required: false })
  @Expose()
  jobId?: string;

  @ApiProperty({ description: "Response message" })
  @Expose()
  message: string;
}

export class CombinedBackfillStatusDto {
  @ApiProperty({ description: "Audio features backfill status" })
  @Expose()
  audioFeatures: BackfillStatusDto;

  @ApiProperty({ description: "Genre backfill status" })
  @Expose()
  genres: BackfillStatusDto;
}
