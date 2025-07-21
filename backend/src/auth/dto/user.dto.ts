import { Expose } from 'class-transformer';
import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class UserDto {
  @Expose()
  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @Expose()
  @IsEmail()
  email: string;

  @Expose()
  id: number;

  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsString()
  provider: string;

  @Expose()
  @IsDateString()
  @IsOptional()
  updatedAt: Date;
}
