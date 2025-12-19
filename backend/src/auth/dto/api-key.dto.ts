import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ApiKeyDto {
  @ApiProperty({ description: "The API key for external clients" })
  @Expose()
  apiKey: string;
}
