import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { TRACK_SORT_FIELDS, TrackSortField } from "./track-sort.constants";
import { TrackDto } from "./track.dto";

export class AlbumTracksResponseDto {
  @ApiProperty({ isArray: true, type: TrackDto })
  @Expose()
  @Type(() => TrackDto)
  tracks: TrackDto[];
}

export class GetAlbumTracksQueryDto {
  @ApiProperty({ description: "Album name" })
  @IsNotEmpty()
  @IsString()
  album: string;

  @ApiProperty({ description: "Artist name" })
  @IsNotEmpty()
  @IsString()
  artist: string;

  @ApiPropertyOptional({ description: "Sort field", enum: TRACK_SORT_FIELDS })
  @IsIn(TRACK_SORT_FIELDS)
  @IsOptional()
  sortBy?: TrackSortField;

  @ApiPropertyOptional({
    default: "desc",
    description: "Sort order",
    enum: ["asc", "desc"],
  })
  @IsIn(["asc", "desc"])
  @IsOptional()
  sortOrder?: "asc" | "desc";
}
