import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SyncStatusDto {
  @ApiProperty({
    description: 'Last sync date',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
    type: Date,
  })
  @Expose()
  lastSync: Date | null;

  @ApiProperty({
    description: 'Total number of albums synced',
    example: 150,
  })
  @Expose()
  totalAlbums: number;

  @ApiProperty({
    description: 'Total number of tracks synced',
    example: 2500,
  })
  @Expose()
  totalTracks: number;
}
