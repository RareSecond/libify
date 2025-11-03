import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

export class CurrentPlaybackDeviceDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  type: string;

  @ApiProperty()
  @Expose()
  volumePercent: number;
}

export class CurrentPlaybackTrackArtistDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
}

export class CurrentPlaybackTrackAlbumDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ type: [String] })
  @Expose()
  images: string[];
}

export class CurrentPlaybackTrackDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  durationMs: number;

  @ApiProperty({ type: CurrentPlaybackTrackAlbumDto })
  @Expose()
  @Type(() => CurrentPlaybackTrackAlbumDto)
  album: CurrentPlaybackTrackAlbumDto;

  @ApiProperty({ type: [CurrentPlaybackTrackArtistDto] })
  @Expose()
  @Type(() => CurrentPlaybackTrackArtistDto)
  artists: CurrentPlaybackTrackArtistDto[];
}

export class CurrentPlaybackStateDto {
  @ApiProperty()
  @Expose()
  isPlaying: boolean;

  @ApiProperty()
  @Expose()
  progressMs: number;

  @ApiProperty({ type: CurrentPlaybackDeviceDto, nullable: true })
  @Expose()
  @Type(() => CurrentPlaybackDeviceDto)
  device: CurrentPlaybackDeviceDto | null;

  @ApiProperty({ type: CurrentPlaybackTrackDto, nullable: true })
  @Expose()
  @Type(() => CurrentPlaybackTrackDto)
  track: CurrentPlaybackTrackDto | null;

  @ApiProperty()
  @Expose()
  shuffleState: boolean;

  @ApiProperty()
  @Expose()
  repeatState: string;
}
