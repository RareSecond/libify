import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import axios from 'axios';

import { EncryptionService } from '../common/encryption/encryption.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private prisma: DatabaseService,
    private encryptionService: EncryptionService,
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

    // Decrypt the access token
    let decryptedAccessToken: string;
    try {
      decryptedAccessToken = this.encryptionService.decrypt(
        user.spotifyAccessToken,
      );
    } catch (error) {
      this.logger.error('Failed to decrypt access token', error);
      return null;
    }

    // Check if token is expired or will expire in the next 5 minutes
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (
      user.tokenExpiresAt &&
      new Date(user.tokenExpiresAt.getTime() - expiryBuffer) <= now
    ) {
      // Token is expired or about to expire, refresh it
      if (user.spotifyRefreshToken) {
        try {
          // Decrypt refresh token
          const decryptedRefreshToken = this.encryptionService.decrypt(
            user.spotifyRefreshToken,
          );
          const newAccessToken = await this.refreshSpotifyToken(
            userId,
            decryptedRefreshToken,
          );
          if (newAccessToken) {
            return newAccessToken;
          }
        } catch (error) {
          this.logger.error('Failed to refresh Spotify token', error);
        }
      }
      // If refresh fails, return null to force re-authentication
      return null;
    }

    return decryptedAccessToken;
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

    const tokenExpiresAt =
      expiresIn && typeof expiresIn === 'number' && expiresIn > 0
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
            spotifyAccessToken: accessToken
              ? this.encryptionService.encrypt(accessToken)
              : undefined,
            spotifyId: providerId,
            spotifyRefreshToken: refreshToken
              ? this.encryptionService.encrypt(refreshToken)
              : undefined,
            tokenExpiresAt,
          }),
        },
      });
    } else if (provider === 'spotify' && accessToken && refreshToken) {
      // Update tokens for existing user
      user = await this.prisma.user.update({
        data: {
          spotifyAccessToken: this.encryptionService.encrypt(accessToken),
          spotifyRefreshToken: this.encryptionService.encrypt(refreshToken),
          tokenExpiresAt,
        },
        where: { id: user.id },
      });
    }

    return user;
  }

  private async refreshSpotifyToken(
    userId: string,
    refreshToken: string,
  ): Promise<null | string> {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        this.logger.error('Spotify client credentials not configured');
        return null;
      }

      // Create base64 encoded credentials
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );

      // Make request to Spotify token endpoint
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, expires_in, refresh_token } = response.data;

      // Calculate new expiry time
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

      // Update user with new tokens (encrypted)
      await this.prisma.user.update({
        data: {
          spotifyAccessToken: this.encryptionService.encrypt(access_token),
          // Only update refresh token if a new one was provided
          ...(refresh_token && {
            spotifyRefreshToken: this.encryptionService.encrypt(refresh_token),
          }),
          tokenExpiresAt,
        },
        where: { id: userId },
      });

      this.logger.log(
        `Successfully refreshed Spotify token for user ${userId}`,
      );
      return access_token;
    } catch (error) {
      this.logger.error('Failed to refresh Spotify token:', error);
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error('Spotify API error:', error.response.data);
      }
      return null;
    }
  }
}
