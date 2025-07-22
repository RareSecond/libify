import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { PlaylistCriteriaDto } from './playlist-criteria.dto';

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

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty()
  name: string;
}

export class SmartPlaylistWithTracksDto extends SmartPlaylistDto {
  @ApiProperty()
  trackCount: number;
}

export class UpdateSmartPlaylistDto {
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