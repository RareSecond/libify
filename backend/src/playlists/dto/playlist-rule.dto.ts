import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export enum PlaylistRuleField {
  ACOUSTICNESS = "acousticness",
  ALBUM = "album",
  ARTIST = "artist",
  DANCEABILITY = "danceability",
  DATE_ADDED = "dateAdded",
  DURATION = "duration",
  ENERGY = "energy",
  GENRE = "genre",
  INSTRUMENTALNESS = "instrumentalness",
  LAST_PLAYED = "lastPlayed",
  LIVENESS = "liveness",
  PLAY_COUNT = "playCount",
  RATING = "rating",
  SPEECHINESS = "speechiness",
  TAG = "tag",
  TEMPO = "tempo",
  TITLE = "title",
  VALENCE = "valence",
}

export enum PlaylistRuleOperator {
  CONTAINS = "contains",
  ENDS_WITH = "endsWith",
  EQUALS = "equals",
  GREATER_THAN = "greaterThan",
  HAS_ANY_TAG = "hasAnyTag",
  HAS_NO_TAGS = "hasNoTags",
  HAS_TAG = "hasTag",
  IN_LAST = "inLast", // For date fields
  IS_NOT_NULL = "isNotNull",
  IS_NULL = "isNull",
  LESS_THAN = "lessThan",
  NOT_CONTAINS = "notContains",
  NOT_EQUALS = "notEquals",
  NOT_HAS_TAG = "notHasTag",
  NOT_IN_LAST = "notInLast",
  STARTS_WITH = "startsWith",
}

export class PlaylistRuleDto {
  @ApiProperty({ description: "For date rules - number of days" })
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
