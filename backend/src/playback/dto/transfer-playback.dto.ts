import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class TransferPlaybackDto {
  @ApiProperty({ description: "Device ID to transfer playback to" })
  @IsNotEmpty()
  @IsString()
  deviceId: string;
}
