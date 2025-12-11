import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class GetPlaylistsQueryDto {
  @ApiPropertyOptional({ default: 1, description: "Page number", minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 24,
    description: "Page size",
    maximum: 100,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Max(100)
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 24;

  @ApiPropertyOptional({ description: "Search query for playlist name" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sort field",
    enum: ["avgRating", "lastPlayed", "name", "totalPlayCount", "trackCount"],
  })
  @IsOptional()
  @IsString()
  sortBy?:
    | "avgRating"
    | "lastPlayed"
    | "name"
    | "totalPlayCount"
    | "trackCount";

  @ApiPropertyOptional({
    default: "asc",
    description: "Sort order",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "asc";
}
