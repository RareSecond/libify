import { ApiProperty } from "@nestjs/swagger";

import { SyncProgressDto } from "./sync-progress-base.dto";

export class SyncJobResponseDto {
  @ApiProperty({ description: "Job creation timestamp", required: false })
  createdAt?: Date;

  @ApiProperty({ description: "Unique job identifier" })
  jobId: string;

  @ApiProperty({ description: "Success message" })
  message: string;

  @ApiProperty({
    description: "Job status",
    enum: ["queued", "active", "completed", "failed"],
  })
  status: "active" | "completed" | "failed" | "queued";
}

export class SyncJobStatusDto extends SyncJobResponseDto {
  @ApiProperty({ description: "Job completion timestamp", required: false })
  completedAt?: Date;

  @ApiProperty({ description: "Error message if job failed", required: false })
  failedReason?: string;

  @ApiProperty({
    description: "Current progress information",
    required: false,
    type: SyncProgressDto,
  })
  progress?: SyncProgressDto;

  @ApiProperty({ description: "Final sync result", required: false })
  result?: unknown;
}
