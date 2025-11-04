import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

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
