import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsEnum, IsOptional, IsString } from "class-validator";

export enum QuickPlaylistPreset {
  CHILL = "CHILL",
  DECADE = "DECADE",
  DEEP_CUTS = "DEEP_CUTS",
  FEEL_GOOD = "FEEL_GOOD",
  FOCUS = "FOCUS",
  GENRE = "GENRE",
  GYM = "GYM",
}

export class QuickCreatePlaylistDto {
  @ApiProperty({
    description: "Decade string e.g. '1980s' (required for DECADE preset)",
    required: false,
  })
  @IsOptional()
  @IsString()
  decade?: string;

  @ApiProperty({
    description: "Genre name (required for GENRE preset)",
    required: false,
  })
  @IsOptional()
  @IsString()
  genreName?: string;

  @ApiProperty({
    description: "The preset type for the playlist",
    enum: QuickPlaylistPreset,
  })
  @IsEnum(QuickPlaylistPreset)
  preset: QuickPlaylistPreset;
}

export class QuickCreatePlaylistResponseDto {
  @ApiProperty({ description: "The created playlist ID" })
  @Expose()
  id: string;

  @ApiProperty({ description: "The playlist name" })
  @Expose()
  name: string;

  @ApiProperty({ description: "Number of tracks in the playlist" })
  @Expose()
  trackCount: number;
}
