import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

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
