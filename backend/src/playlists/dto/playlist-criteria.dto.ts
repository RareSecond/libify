import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

import { PlaylistRuleDto } from "./playlist-rule.dto";

export enum PlaylistRuleLogic {
  AND = "and",
  OR = "or",
}

export class PlaylistCriteriaDto {
  @ApiProperty({ description: "Limit number of tracks", required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ enum: PlaylistRuleLogic })
  @IsEnum(PlaylistRuleLogic)
  logic: PlaylistRuleLogic;

  @ApiProperty({ description: "Order by field", required: false })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiProperty({ description: "Order direction", required: false })
  @IsOptional()
  @IsString()
  orderDirection?: "asc" | "desc";

  @ApiProperty({ type: [PlaylistRuleDto] })
  @IsArray()
  @Type(() => PlaylistRuleDto)
  @ValidateNested({ each: true })
  rules: PlaylistRuleDto[];
}
