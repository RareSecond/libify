import { ApiProperty } from '@nestjs/swagger';

export type SyncPhase = 'albums' | 'playlists' | 'tracks';

export interface SyncProgressCallback {
  (progress: SyncProgressDto): Promise<void>;
}

export class SyncCategoryProgressDto {
  @ApiProperty({ description: 'Number of items processed' })
  processed: number;

  @ApiProperty({ description: 'Total items to process' })
  total: number;
}

export class SyncItemCountsDto {
  @ApiProperty({ description: 'Number of albums to sync' })
  albums: number;

  @ApiProperty({
    description: 'Number of tracks within albums',
    required: false,
  })
  albumTracks?: number;

  @ApiProperty({ description: 'Number of playlists to sync' })
  playlists: number;

  @ApiProperty({
    description: 'Number of tracks within playlists',
    required: false,
  })
  playlistTracks?: number;

  @ApiProperty({ description: 'Number of liked tracks to sync' })
  tracks: number;
}

export class SyncProgressBreakdownDto {
  @ApiProperty({
    description: 'Album sync progress',
    type: SyncCategoryProgressDto,
  })
  albums: SyncCategoryProgressDto;

  @ApiProperty({
    description: 'Playlist sync progress',
    type: SyncCategoryProgressDto,
  })
  playlists: SyncCategoryProgressDto;

  @ApiProperty({
    description: 'Track sync progress',
    type: SyncCategoryProgressDto,
  })
  tracks: SyncCategoryProgressDto;
}

export class SyncProgressDto {
  @ApiProperty({
    description: 'Progress breakdown by category',
    required: false,
    type: () => SyncProgressBreakdownDto,
  })
  breakdown?: SyncProgressBreakdownDto;

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
