import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { PlaybackTimingsDto } from './playback-timings.dto';

export class PlaybackControlResponseDto {
  @ApiProperty({ example: 'Playback paused' })
  @Expose()
  message: string;
}

export class PlaybackResponseDto {
  @ApiProperty({ example: 'Playback started' })
  @Expose()
  message: string;

  @ApiProperty({ example: 200 })
  @Expose()
  queueLength: number;

  @ApiProperty({ type: PlaybackTimingsDto })
  @Expose()
  @Type(() => PlaybackTimingsDto)
  timings: PlaybackTimingsDto;

  @ApiProperty({
    example: ['spotify:track:abc123', 'spotify:track:def456'],
    isArray: true,
    type: String,
  })
  @Expose()
  trackUris: string[];
}
