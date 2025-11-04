import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

import { CurrentPlaybackDeviceDto } from "./current-playback-device.dto";
import { CurrentPlaybackTrackDto } from "./current-playback-track.dto";

export class CurrentPlaybackStateDto {
  @ApiProperty({ nullable: true, type: CurrentPlaybackDeviceDto })
  @Expose()
  @Type(() => CurrentPlaybackDeviceDto)
  device: CurrentPlaybackDeviceDto | null;

  @ApiProperty()
  @Expose()
  isPlaying: boolean;

  @ApiProperty()
  @Expose()
  progressMs: number;

  @ApiProperty()
  @Expose()
  repeatState: string;

  @ApiProperty()
  @Expose()
  shuffleState: boolean;

  @ApiProperty({ nullable: true, type: CurrentPlaybackTrackDto })
  @Expose()
  @Type(() => CurrentPlaybackTrackDto)
  track: CurrentPlaybackTrackDto | null;
}
