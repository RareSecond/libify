import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SpotifyStrategy } from './strategies/spotify.strategy';

@Module({
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
    }),
    DatabaseModule,
  ],
  providers: [AuthService, SpotifyStrategy, JwtStrategy],
})
export class AuthModule {}
