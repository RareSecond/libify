import { ApiProperty } from '@nestjs/swagger';

export type SyncPhase = 'albums' | 'playlists' | 'tracks';

export interface SyncProgressCallback {
  (progress: SyncProgressDto): Promise<void>;
}

export class SyncProgressDto {
  @ApiProperty({ description: 'Number of items processed in current phase' })
  current: number;

  @ApiProperty({ description: 'List of non-fatal errors encountered' })
  errors: string[];

  @ApiProperty({
    description: 'Estimated time remaining in seconds',
    required: false,
  })
  estimatedTimeRemaining?: number;

  @ApiProperty({
    description: 'Processing speed (items per second)',
    required: false,
  })
  itemsPerSecond?: number;

  @ApiProperty({ description: 'Human-readable status message' })
  message: string;

  @ApiProperty({ description: 'Overall progress percentage (0-100)' })
  percentage: number;

  @ApiProperty({
    description: 'Current sync phase',
    enum: ['tracks', 'albums', 'playlists'],
  })
  phase: SyncPhase;

  @ApiProperty({ description: 'Total items to process in current phase' })
  total: number;
}
