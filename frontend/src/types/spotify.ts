// Spotify Web Playback SDK types
export interface SpotifyApi {
  Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
}

export interface SpotifyError {
  message: string;
}

export interface SpotifyPlayer {
  addListener: (event: string, callback: (data: unknown) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  getCurrentState: () => Promise<null | SpotifyPlayerState>;
  getVolume: () => Promise<number>;
  nextTrack: () => Promise<void>;
  pause: () => Promise<void>;
  previousTrack: () => Promise<void>;
  removeListener: (event: string, callback?: (data: unknown) => void) => void;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setName: (name: string) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  togglePlay: () => Promise<void>;
}

export interface SpotifyPlayerOptions {
  getOAuthToken: (cb: (token: string) => void) => void;
  name: string;
  volume?: number;
}

export interface SpotifyPlayerState {
  context: {
    metadata: unknown;
    uri: string;
  };
  disallows: {
    pausing: boolean;
    peeking_next: boolean;
    peeking_prev: boolean;
    resuming: boolean;
    seeking: boolean;
    skipping_next: boolean;
    skipping_prev: boolean;
  };
  paused: boolean;
  position: number;
  repeat_mode: number;
  shuffle: boolean;
  track_window: {
    current_track: SpotifyTrack;
    next_tracks: SpotifyTrack[];
    previous_tracks: SpotifyTrack[];
  };
}

export interface SpotifyTrack {
  album: {
    images: Array<{ url: string }>;
    name: string;
  };
  artists: Array<{ name: string }>;
  duration_ms: number;
  id: string;
  name: string;
  uri: string;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: SpotifyApi;
    spotifySDKReady?: boolean;
  }
}
