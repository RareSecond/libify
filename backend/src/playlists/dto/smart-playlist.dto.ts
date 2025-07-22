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
  ALBUM = 'album',
  ARTIST = 'artist',
  DATE_ADDED = 'dateAdded',
  DURATION = 'duration',
  LAST_PLAYED = 'lastPlayed',
  PLAY_COUNT = 'playCount',
  RATING = 'rating',
  TAG = 'tag',
  TITLE = 'title',
}

export enum PlaylistRuleLogic {
  AND = 'and',
  OR = 'or',
}

export enum PlaylistRuleOperator {
  CONTAINS = 'contains',
  ENDS_WITH = 'endsWith',
  EQUALS = 'equals',
  GREATER_THAN = 'greaterThan',
  HAS_TAG = 'hasTag',
  IN_LAST = 'inLast', // For date fields
  LESS_THAN = 'lessThan',
  NOT_CONTAINS = 'notContains',
  NOT_EQUALS = 'notEquals',
  NOT_HAS_TAG = 'notHasTag',
  NOT_IN_LAST = 'notInLast',
  STARTS_WITH = 'startsWith',
}

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

export class PlaylistCriteriaDto {
  @ApiProperty({ description: 'Maximum number of tracks', required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ default: PlaylistRuleLogic.AND, enum: PlaylistRuleLogic })
  @IsEnum(PlaylistRuleLogic)
  @IsOptional()
  logic?: PlaylistRuleLogic = PlaylistRuleLogic.AND;

  @ApiProperty({ description: 'Order by field', required: false })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiProperty({ description: 'Order direction', required: false })
  @IsOptional()
  @IsString()
  orderDirection?: 'asc' | 'desc';

  @ApiProperty({ type: [PlaylistRuleDto] })
  @IsArray()
  @Type(() => PlaylistRuleDto)
  @ValidateNested({ each: true })
  rules: PlaylistRuleDto[];
}

export class PlaylistRuleDto {
  @ApiProperty({ description: 'For date rules - number of days' })
  @IsNumber()
  @IsOptional()
  daysValue?: number;

  @ApiProperty({ enum: PlaylistRuleField })
  @IsEnum(PlaylistRuleField)
  field: PlaylistRuleField;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  numberValue?: number;

  @ApiProperty({ enum: PlaylistRuleOperator })
  @IsEnum(PlaylistRuleOperator)
  operator: PlaylistRuleOperator;

  @ApiProperty()
  @IsOptional()
  @IsString()
  value?: string;
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