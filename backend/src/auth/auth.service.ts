import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: DatabaseService,
  ) {}

  async getSpotifyAccessToken(userId: string): Promise<null | string> {
    const user = await this.prisma.user.findUnique({
      select: {
        spotifyAccessToken: true,
        spotifyRefreshToken: true,
        tokenExpiresAt: true,
      },
      where: { id: userId },
    });

    if (!user || !user.spotifyAccessToken) {
      return null;
    }

    // Check if token is expired
    if (user.tokenExpiresAt && new Date() > user.tokenExpiresAt) {
      // TODO: Implement token refresh logic
      // For now, return null to force re-authentication
      return null;
    }

    return user.spotifyAccessToken;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateUser(
    email: string,
    name: string,
    provider: string,
    providerId: string,
    accessToken?: string,
    refreshToken?: string,
    expiresIn?: number,
  ): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    const tokenExpiresAt = expiresIn && typeof expiresIn === 'number' && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000)
      : undefined;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          provider,
          providerId,
          ...(provider === 'spotify' && {
            spotifyAccessToken: accessToken,
            spotifyId: providerId,
            spotifyRefreshToken: refreshToken,
            tokenExpiresAt,
          }),
        },
      });
    } else if (provider === 'spotify' && accessToken && refreshToken) {
      // Update tokens for existing user
      user = await this.prisma.user.update({
        data: {
          spotifyAccessToken: accessToken,
          spotifyRefreshToken: refreshToken,
          tokenExpiresAt,
        },
        where: { id: user.id },
      });
    }

    return user;
  }
}
