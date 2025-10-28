import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { ContextType } from '../types/context-type.enum';

export class PlayContextDto {
  @ApiPropertyOptional({
    description: 'ID of the context (playlist, album, artist, etc.)',
    example: 'abc123',
  })
  @Expose()
  @IsOptional()
  @IsString()
  contextId?: string;

  @ApiPropertyOptional({
    description: 'Name of the context for display',
    example: 'My Favorite Songs',
  })
  @Expose()
  @IsOptional()
  @IsString()
  contextName?: string;

  @ApiProperty({
    description: 'Type of context to play',
    enum: ContextType,
    example: ContextType.LIBRARY,
  })
  @Expose()
  @IsEnum(ContextType)
  contextType: ContextType;

  @ApiPropertyOptional({
    description: 'Whether to shuffle the queue',
    example: true,
  })
  @Expose()
  @IsBoolean()
  @IsOptional()
  shuffle?: boolean;

  @ApiPropertyOptional({
    description: 'Position to start playing from',
    example: 0,
  })
  @Expose()
  @IsInt()
  @IsOptional()
  @Min(0)
  startPosition?: number;
}
