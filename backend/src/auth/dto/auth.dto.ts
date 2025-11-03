import { Expose, Transform } from "class-transformer";

import { UserDto } from "./user.dto";

export class AuthResponseDto {
  @Expose()
  access_token: string;

  @Expose()
  @Transform(({ obj }) => obj.user)
  user: UserDto;
}

export class LogoutResponseDto {
  @Expose()
  message: string;
}
