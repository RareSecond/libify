import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsHexColor, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddTagToTrackDto {
  @ApiProperty({ description: 'Tag ID to add to the track' })
  @IsUUID()
  tagId: string;
}

export class CreateTagDto {
  @ApiPropertyOptional({ description: 'Tag color in hex format' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Tag name' })
  @IsString()
  name: string;
}

export class RemoveTagFromTrackDto {
  @ApiProperty({ description: 'Tag ID to remove from the track' })
  @IsUUID()
  tagId: string;
}

export class TagResponseDto {
  @ApiPropertyOptional()
  @Expose()
  color?: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;
}

export class UpdateTagDto {
  @ApiPropertyOptional({ description: 'Tag color in hex format' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Tag name' })
  @IsOptional()
  @IsString()
  name?: string;
}