import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { TrackDto } from './track.dto';

export class AlbumTracksResponseDto {
  @ApiProperty({ isArray: true, type: TrackDto })
  @Type(() => TrackDto)
  tracks: TrackDto[];
}
