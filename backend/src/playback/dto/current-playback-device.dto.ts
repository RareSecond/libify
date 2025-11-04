import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class CurrentPlaybackDeviceDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  type: string;

  @ApiProperty()
  @Expose()
  volumePercent: number;
}
