import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

import { TrackDto } from "./track.dto";

export class ArtistTracksResponseDto {
  @ApiProperty({ isArray: true, type: TrackDto })
  @Type(() => TrackDto)
  tracks: TrackDto[];
}

export class GetArtistTracksQueryDto {
  @ApiProperty({ description: "Artist name" })
  @IsString()
  artist: string;

  @ApiPropertyOptional({
    description: "Sort field",
    enum: [
      "title",
      "artist",
      "album",
      "addedAt",
      "lastPlayedAt",
      "totalPlayCount",
      "rating",
      "duration",
    ],
  })
  @IsOptional()
  @IsString()
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
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc";
}
