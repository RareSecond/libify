import { Expose } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
} from "class-validator";

export class UserDto {
  @Expose()
  @IsDateString()
  @IsOptional()
  createdAt: Date;

  @Expose()
  @IsEmail()
  email: string;

  @Expose()
  @IsBoolean()
  hasCompletedOnboarding: boolean;

  @Expose()
  id: number;

  @Expose()
  @IsBoolean()
  isAdmin: boolean;

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
