import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class TopItemDto {
  @ApiProperty({ description: "Item count (play count or track count)" })
  @Expose()
  count: number;

  @ApiProperty({ description: "Internal track/artist ID", required: false })
  @Expose()
  id?: string;

  @ApiProperty({
    description: "Image URL (album art or artist image)",
    required: false,
  })
  @Expose()
  imageUrl?: string;

  @ApiProperty({
    description: "Additional info (artist name for tracks, genre for artists)",
    required: false,
  })
  @Expose()
  info?: string;

  @ApiProperty({ description: "Item name (track title or artist name)" })
  @Expose()
  name: string;

  @ApiProperty({ description: "Spotify ID", required: false })
  @Expose()
  spotifyId?: string;
}
