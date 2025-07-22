import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateRatingDto {
  @ApiProperty({ description: 'Rating value (1-5)', example: 5, maximum: 5, minimum: 1 })
  @IsInt()
  @Max(5)
  @Min(1)
  rating: number;
}