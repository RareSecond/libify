import { ApiProperty } from "@nestjs/swagger";

export class PlaySyncResultDto {
  @ApiProperty({ description: "Job ID for the sync operation" })
  jobId: string;

  @ApiProperty({ description: "Human-readable message about the sync result" })
  message: string;

  @ApiProperty({
    description: "Number of new plays imported",
    nullable: true,
    required: false,
  })
  newPlaysCount?: number;

  @ApiProperty({ description: "Status of the sync job" })
  status: string;
}
