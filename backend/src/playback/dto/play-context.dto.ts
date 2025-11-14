import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

import { ContextType } from "../types/context-type.enum";

export class PlayContextDto {
  @ApiPropertyOptional({
    description: "Index of clicked track in current page (0-based)",
    example: 10,
  })
  @Expose()
  @IsInt()
  @IsOptional()
  @Min(0)
  clickedIndex?: number;

  @ApiPropertyOptional({
    description: "ID of the context (playlist, album, artist, etc.)",
    example: "abc123",
  })
  @Expose()
  @IsOptional()
  @IsString()
  contextId?: string;

  @ApiProperty({
    description: "Type of context to play",
    enum: ContextType,
    example: ContextType.LIBRARY,
  })
  @Expose()
  @IsEnum(ContextType)
  contextType: ContextType;

  @ApiPropertyOptional({
    description: "Spotify device ID to play on",
    example: "b980b2daec2c8e1df7fe2677c0fd4421ae0ae013",
  })
  @Expose()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    description: "Current page number (1-based)",
    example: 4,
  })
  @Expose()
  @IsInt()
  @IsOptional()
  @Min(1)
  pageNumber?: number;

  @ApiPropertyOptional({ description: "Number of items per page", example: 20 })
  @Expose()
  @IsInt()
  @IsOptional()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    description: "Search query string to filter tracks",
    example: "Beatles",
  })
  @Expose()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Whether to shuffle the queue",
    example: true,
  })
  @Expose()
  @IsBoolean()
  @IsOptional()
  shuffle?: boolean;

  @ApiPropertyOptional({ description: "Field to sort by", example: "addedAt" })
  @Expose()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["asc", "desc"],
    example: "desc",
  })
  @Expose()
  @IsOptional()
  @IsString()
  sortOrder?: string;

  @ApiPropertyOptional({
    description:
      "Position to start playing from (deprecated - use pagination fields)",
    example: 0,
  })
  @Expose()
  @IsInt()
  @IsOptional()
  @Min(0)
  startPosition?: number;

  @ApiPropertyOptional({
    description: "Filter for unrated tracks only",
    example: true,
  })
  @Expose()
  @IsBoolean()
  @IsOptional()
  unratedOnly?: boolean;
}
