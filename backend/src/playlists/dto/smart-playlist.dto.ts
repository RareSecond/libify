import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

import { PlaylistCriteriaDto } from "./playlist-criteria.dto";

export class CreateSmartPlaylistDto {
  @ApiProperty({ type: PlaylistCriteriaDto })
  @Type(() => PlaylistCriteriaDto)
  @ValidateNested()
  criteria: PlaylistCriteriaDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty()
  @IsString()
  name: string;
}

export class SmartPlaylistDto {
  @ApiProperty({
    default: true,
    description: "Enable automatic sync to Spotify",
  })
  autoSync: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: PlaylistCriteriaDto })
  criteria: PlaylistCriteriaDto;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ nullable: true, required: false })
  lastSyncedAt?: Date | null;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true, required: false })
  spotifyPlaylistId?: null | string;
}

export class SmartPlaylistWithTracksDto extends SmartPlaylistDto {
  @ApiProperty()
  trackCount: number;
}

export class SyncToSpotifyResponseDto {
  @ApiProperty({ description: "The Spotify playlist ID" })
  spotifyPlaylistId: string;

  @ApiProperty({ description: "Number of tracks synced to the playlist" })
  trackCount: number;
}

export class UpdateSmartPlaylistDto {
  @ApiProperty({
    description: "Enable automatic sync to Spotify",
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoSync?: boolean;

  @ApiProperty({ required: false, type: PlaylistCriteriaDto })
  @IsOptional()
  @Type(() => PlaylistCriteriaDto)
  @ValidateNested()
  criteria?: PlaylistCriteriaDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;
}
