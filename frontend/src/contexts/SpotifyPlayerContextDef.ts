import { createContext } from "react";

import { PlayContext } from "@/types/playback.types";
import { SpotifyPlayer, SpotifyTrack } from "@/types/spotify";

export interface SpotifyPlayerContextType {
  currentContext: null | PlayContext;
  currentTrack: null | SpotifyTrack;
  currentTrackIndex: number;
  currentTrackList: string[];
  deviceId: null | string;
  duration: number;
  isPlaying: boolean;
  isReady: boolean;
  isShuffled: boolean;
  nextTrack: () => Promise<void>;
  originalTrackList: string[];
  pause: () => Promise<void>;
  play: (uri?: string) => Promise<void>;
  player: null | SpotifyPlayer;
  playTrackList: (
    tracks: string[] | TrackWithId[],
    context?: PlayContext,
  ) => Promise<void>;
  playUris: (uris: string[]) => Promise<void>;
  position: number;
  previousTrack: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  volume: number;
}

export interface TrackWithId {
  spotifyUri: string;
  trackId?: string;
}

export const SpotifyPlayerContext =
  createContext<null | SpotifyPlayerContextType>(null);
