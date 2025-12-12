import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { TrackDto } from "./track.dto";

export class ArtistTracksResponseDto {
  @ApiProperty({ isArray: true, type: TrackDto })
  @Expose()
  @Type(() => TrackDto)
  tracks: TrackDto[];
}

const SORT_BY_VALUES = [
  "title",
  "artist",
  "album",
  "addedAt",
  "lastPlayedAt",
  "totalPlayCount",
  "rating",
  "duration",
] as const;

export class GetArtistTracksQueryDto {
  @ApiProperty({ description: "Artist name" })
  @IsNotEmpty()
  @IsString()
  artist: string;

  @ApiPropertyOptional({ description: "Sort field", enum: SORT_BY_VALUES })
  @IsIn(SORT_BY_VALUES)
  @IsOptional()
  sortBy?:
    | "addedAt"
    | "album"
    | "artist"
    | "duration"
    | "lastPlayedAt"
    | "rating"
    | "title"
    | "totalPlayCount";

  @ApiPropertyOptional({
    default: "desc",
    description: "Sort order",
    enum: ["asc", "desc"],
  })
  @IsIn(["asc", "desc"])
  @IsOptional()
  sortOrder?: "asc" | "desc";
}
