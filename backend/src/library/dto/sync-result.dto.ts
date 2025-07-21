import { ApiProperty } from '@nestjs/swagger';

export class SyncResultDto {
  @ApiProperty({ description: 'List of errors encountered during sync' })
  errors: string[];

  @ApiProperty({ description: 'Number of new tracks added' })
  newTracks: number;

  @ApiProperty({ description: 'Total number of tracks processed' })
  totalTracks: number;

  @ApiProperty({ description: 'Number of existing tracks updated' })
  updatedTracks: number;
}

export class SyncStatusDto {
  @ApiProperty({ description: 'Last sync timestamp', nullable: true })
  lastSync: Date | null;

  @ApiProperty({ description: 'Total number of tracks in library' })
  totalTracks: number;
}