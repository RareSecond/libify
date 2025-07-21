import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-spotify';

import { AuthService } from '../auth.service';

@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  constructor(private authService: AuthService) {
    super({
      callbackURL: `${process.env.APP_URL}/auth/spotify/callback`,
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      scope: ['user-read-email', 'user-read-private'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { displayName, emails, id } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new Error('Email not found in Spotify profile');
    }

    const user = await this.authService.validateUser(
      email,
      displayName,
      'spotify',
      id,
    );

    return user;
  }
}
