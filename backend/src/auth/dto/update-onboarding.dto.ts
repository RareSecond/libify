import { Expose } from "class-transformer";
import { IsBoolean } from "class-validator";

export class UpdateOnboardingDto {
  @Expose()
  @IsBoolean()
  hasCompletedOnboarding: boolean;
}
