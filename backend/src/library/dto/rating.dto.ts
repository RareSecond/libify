import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, Max, Min } from "class-validator";

export class UpdateRatingDto {
  @ApiProperty({
    description: "Rating value (0.5-5 in 0.5 increments)",
    example: 4.5,
    maximum: 5,
    minimum: 0.5,
  })
  @IsNumber()
  @Max(5)
  @Min(0.5)
  @Transform(({ value }) => {
    // Round to nearest 0.5
    return Math.round(value * 2) / 2;
  })
  rating: number;
}
