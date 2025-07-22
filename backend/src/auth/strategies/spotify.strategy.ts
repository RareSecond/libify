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
      scope: [
        'user-read-email',
        'user-read-private',
        'user-library-read',
        'user-read-recently-played',
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-modify-playback-state',
        'streaming',
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    params: { expires_in?: number },
    profile: {
      _json?: { display_name?: string; email?: string; id?: string };
      displayName?: string;
      emails?: Array<{ value: string }>;
      id?: string;
      provider?: string;
    },
  ) {
    // Check if arguments are shifted (common passport issue)
    if (typeof params === 'object' && 'provider' in params) {
      // Profile is in params position
      profile = params as typeof profile;
      params = {};
    }

    const expires_in = params?.expires_in || 3600;

    // Extract user data from profile
    const spotifyId = profile.id || profile._json?.id;
    const email =
      profile.emails?.[0]?.value ||
      profile._json?.email ||
      `${spotifyId}@spotify.local`;
    const name =
      profile.displayName || profile._json?.display_name || 'Spotify User';

    if (!spotifyId) {
      throw new Error('Unable to extract Spotify ID from profile');
    }

    const user = await this.authService.validateUser(
      email,
      name,
      'spotify',
      spotifyId,
      accessToken,
      refreshToken,
      expires_in,
    );

    return user;
  }
}
