import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PlaybackTimingsDto {
  @ApiProperty({ example: 150 })
  @Expose()
  queueGeneration: number;

  @ApiProperty({ example: 300 })
  @Expose()
  spotifyCall: number;

  @ApiProperty({ example: 450 })
  @Expose()
  total: number;
}
