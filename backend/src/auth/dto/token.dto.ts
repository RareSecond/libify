import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class TokenDto {
  @ApiProperty({ description: "Spotify access token", example: "BQD..." })
  @Expose()
  accessToken: string;
}
