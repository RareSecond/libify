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

export class CurrentPlaybackTrackAlbumDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ type: [String] })
  @Expose()
  images: string[];

  @ApiProperty()
  @Expose()
  name: string;
}

export class CurrentPlaybackTrackArtistDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
}

export class CurrentPlaybackTrackDto {
  @ApiProperty({ type: CurrentPlaybackTrackAlbumDto })
  @Expose()
  @Type(() => CurrentPlaybackTrackAlbumDto)
  album: CurrentPlaybackTrackAlbumDto;

  @ApiProperty({ type: [CurrentPlaybackTrackArtistDto] })
  @Expose()
  @Type(() => CurrentPlaybackTrackArtistDto)
  artists: CurrentPlaybackTrackArtistDto[];

  @ApiProperty()
  @Expose()
  durationMs: number;

  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
}
