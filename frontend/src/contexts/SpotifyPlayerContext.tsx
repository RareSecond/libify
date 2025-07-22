import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { useAuthControllerGetProfile } from '../data/api';
import { SpotifyPlayer, SpotifyPlayerState, SpotifyTrack } from '../types/spotify';

interface SpotifyPlayerContextType {
  currentTrack: null | SpotifyTrack;
  deviceId: null | string;
  duration: number;
  isPlaying: boolean;
  isReady: boolean;
  nextTrack: () => Promise<void>;
  pause: () => Promise<void>;
  play: (uri?: string) => Promise<void>;
  playTrackList: (trackUris: string[], startIndex?: number) => Promise<void>;
  player: null | SpotifyPlayer;
  position: number;
  previousTrack: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  volume: number;
  currentTrackList: string[];
  currentTrackIndex: number;
}

const SpotifyPlayerContext = createContext<null | SpotifyPlayerContextType>(null);

interface SpotifyPlayerProviderProps {
  children: ReactNode;
}

export function SpotifyPlayerProvider({ children }: SpotifyPlayerProviderProps) {
  const [player, setPlayer] = useState<null | SpotifyPlayer>(null);
  const [deviceId, setDeviceId] = useState<null | string>(null);
  const [currentTrack, setCurrentTrack] = useState<null | SpotifyTrack>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [isReady, setIsReady] = useState(false);
  const [currentTrackList, setCurrentTrackList] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const { data: user } = useAuthControllerGetProfile();

  useEffect(() => {
    if (!user) return;

    const initializePlayer = () => {
      const spotifyPlayer = new window.Spotify.Player({
        getOAuthToken: (cb) => {
          fetch(`${import.meta.env.VITE_API_URL}/auth/token`, { credentials: 'include' })
            .then(response => response.json())
            .then(data => cb(data.accessToken))
            .catch(() => cb(''));
        },
        name: 'Spotlib Web Player',
        volume,
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state: null | SpotifyPlayerState) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.track_window.current_track.duration_ms);
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    // Check if SDK is already loaded or wait for it
    const checkAndInitialize = () => {
      if (window.Spotify) {
        initializePlayer();
      } else if ((window as any).spotifySDKReady) {
        // SDK loaded but Spotify object not available yet, retry
        setTimeout(checkAndInitialize, 100);
      }
    };

    // Start checking immediately
    checkAndInitialize();

    // Also set up the callback in case it hasn't fired yet
    const originalCallback = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      if (originalCallback) originalCallback();
      checkAndInitialize();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [user, volume]);

  // Update position periodically when playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (player) {
        player.getCurrentState().then((state) => {
          if (state) {
            setPosition(state.position);
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, player]);

  const play = async (uri?: string) => {
    if (!player || !deviceId) return;

    if (uri) {
      // Play specific track and reset track list to just this track
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        body: JSON.stringify({ uris: [uri] }),
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      });
      
      if (!response.ok) {
        console.error('Failed to play track:', response.statusText);
      } else {
        // Update track list to just contain this track
        setCurrentTrackList([uri]);
        setCurrentTrackIndex(0);
      }
    } else {
      // Resume current track
      await player.resume();
    }
  };

  const playTrackList = async (trackUris: string[], startIndex: number = 0) => {
    if (!player || !deviceId || trackUris.length === 0) return;

    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      body: JSON.stringify({ 
        uris: trackUris,
        offset: { position: startIndex }
      }),
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      method: 'PUT',
    });
    
    if (!response.ok) {
      console.error('Failed to play track list:', response.statusText);
    } else {
      setCurrentTrackList(trackUris);
      setCurrentTrackIndex(startIndex);
    }
  };

  const pause = async () => {
    if (player) {
      await player.pause();
    }
  };

  const resume = async () => {
    if (player) {
      await player.resume();
    }
  };

  const nextTrack = async () => {
    if (!player || currentTrackList.length === 0) return;

    const nextIndex = currentTrackIndex + 1;
    
    if (nextIndex < currentTrackList.length) {
      // Play next track in our list
      const nextUri = currentTrackList[nextIndex];
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        body: JSON.stringify({ uris: [nextUri] }),
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      });
      
      if (!response.ok) {
        console.error('Failed to play next track:', response.statusText);
      } else {
        setCurrentTrackIndex(nextIndex);
      }
    } else {
      // Try Spotify's native next (in case there's a queue)
      await player.nextTrack();
    }
  };

  const previousTrack = async () => {
    if (!player || currentTrackList.length === 0) return;

    const prevIndex = currentTrackIndex - 1;
    
    if (prevIndex >= 0) {
      // Play previous track in our list
      const prevUri = currentTrackList[prevIndex];
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        body: JSON.stringify({ uris: [prevUri] }),
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      });
      
      if (!response.ok) {
        console.error('Failed to play previous track:', response.statusText);
      } else {
        setCurrentTrackIndex(prevIndex);
      }
    } else {
      // Try Spotify's native previous
      await player.previousTrack();
    }
  };

  const seek = async (newPosition: number) => {
    if (player) {
      await player.seek(newPosition);
      setPosition(newPosition);
    }
  };

  const setVolume = async (newVolume: number) => {
    if (player) {
      await player.setVolume(newVolume);
      setVolumeState(newVolume);
    }
  };

  const getAccessToken = async (): Promise<string> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/token`, { credentials: 'include' });
    const data = await response.json();
    return data.accessToken;
  };

  const contextValue: SpotifyPlayerContextType = {
    currentTrack,
    deviceId,
    duration,
    isPlaying,
    isReady,
    nextTrack,
    pause,
    play,
    playTrackList,
    player,
    position,
    previousTrack,
    resume,
    seek,
    setVolume,
    volume,
    currentTrackList,
    currentTrackIndex,
  };

  return (
    <SpotifyPlayerContext.Provider value={contextValue}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (!context) {
    throw new Error('useSpotifyPlayer must be used within a SpotifyPlayerProvider');
  }
  return context;
}