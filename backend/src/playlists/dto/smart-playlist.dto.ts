import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum PlaylistRuleField {
  TITLE = 'title',
  ARTIST = 'artist',
  ALBUM = 'album',
  RATING = 'rating',
  PLAY_COUNT = 'playCount',
  LAST_PLAYED = 'lastPlayed',
  DATE_ADDED = 'dateAdded',
  TAG = 'tag',
  DURATION = 'duration',
}

export enum PlaylistRuleOperator {
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN_LAST = 'inLast', // For date fields
  NOT_IN_LAST = 'notInLast',
  HAS_TAG = 'hasTag',
  NOT_HAS_TAG = 'notHasTag',
}

export enum PlaylistRuleLogic {
  AND = 'and',
  OR = 'or',
}

export class PlaylistRuleDto {
  @ApiProperty({ enum: PlaylistRuleField })
  @IsEnum(PlaylistRuleField)
  field: PlaylistRuleField;

  @ApiProperty({ enum: PlaylistRuleOperator })
  @IsEnum(PlaylistRuleOperator)
  operator: PlaylistRuleOperator;

  @ApiProperty()
  @IsString()
  @IsOptional()
  value?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  numberValue?: number;

  @ApiProperty({ description: 'For date rules - number of days' })
  @IsNumber()
  @IsOptional()
  daysValue?: number;
}

export class PlaylistCriteriaDto {
  @ApiProperty({ type: [PlaylistRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaylistRuleDto)
  rules: PlaylistRuleDto[];

  @ApiProperty({ enum: PlaylistRuleLogic, default: PlaylistRuleLogic.AND })
  @IsEnum(PlaylistRuleLogic)
  @IsOptional()
  logic?: PlaylistRuleLogic = PlaylistRuleLogic.AND;

  @ApiProperty({ description: 'Maximum number of tracks', required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Order by field', required: false })
  @IsString()
  @IsOptional()
  orderBy?: string;

  @ApiProperty({ description: 'Order direction', required: false })
  @IsString()
  @IsOptional()
  orderDirection?: 'asc' | 'desc';
}

export class CreateSmartPlaylistDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: PlaylistCriteriaDto })
  @ValidateNested()
  @Type(() => PlaylistCriteriaDto)
  criteria: PlaylistCriteriaDto;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateSmartPlaylistDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: PlaylistCriteriaDto, required: false })
  @ValidateNested()
  @Type(() => PlaylistCriteriaDto)
  @IsOptional()
  criteria?: PlaylistCriteriaDto;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SmartPlaylistDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ type: PlaylistCriteriaDto })
  criteria: PlaylistCriteriaDto;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty()
  createdAt: Date;
}

export class SmartPlaylistWithTracksDto extends SmartPlaylistDto {
  @ApiProperty()
  trackCount: number;
}