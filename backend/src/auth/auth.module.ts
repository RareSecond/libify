import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { DatabaseModule } from "../database/database.module";
import { ApiKeyService } from "./api-key.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ApiKeyStrategy } from "./strategies/api-key.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { SpotifyStrategy } from "./strategies/spotify.strategy";

@Module({
  controllers: [AuthController],
  exports: [AuthService, ApiKeyService, JwtModule],
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || "30d" },
    }),
    DatabaseModule,
  ],
  providers: [
    AuthService,
    ApiKeyService,
    SpotifyStrategy,
    JwtStrategy,
    ApiKeyStrategy,
  ],
})
export class AuthModule {}
