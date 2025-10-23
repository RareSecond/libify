import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class TrackSourceDto {
  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  id: string;

  @ApiPropertyOptional({ description: 'Spotify ID of the source' })
  @Expose()
  sourceId?: string;

  @ApiPropertyOptional({
    description: 'Name of the source (e.g., playlist name)',
  })
  @Expose()
  sourceName?: string;

  @ApiProperty({
    description: 'Type of source',
    enum: SourceType,
  })
  @Expose()
  sourceType: SourceType;
}
