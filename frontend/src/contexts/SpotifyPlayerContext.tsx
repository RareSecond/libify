/* eslint-disable max-lines */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuthControllerGetProfile } from "@/data/api";
import { usePlayTracking } from "@/hooks/usePlayTracking";
import { useShuffleManager } from "@/hooks/useShuffleManager";
import { useSpotifyAPI } from "@/hooks/useSpotifyAPI";
import {
  SpotifyPlayer,
  SpotifyPlayerState,
  SpotifyTrack,
} from "@/types/spotify";

interface PlayContext {
  contextId?: string;
  contextType?: "album" | "artist" | "library" | "playlist";
  search?: string;
}
interface SpotifyPlayerContextType {
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
    startIndex?: number,
    context?: PlayContext,
    onPlayRecorded?: () => void,
  ) => Promise<void>;
  position: number;
  previousTrack: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  volume: number;
}
interface TrackWithId {
  spotifyUri: string;
  trackId?: string;
}
const SpotifyPlayerContext = createContext<null | SpotifyPlayerContextType>(
  null,
);
interface SpotifyPlayerProviderProps {
  children: ReactNode;
}

// Global singleton to survive hot-reloads in development
let globalPlayer: null | SpotifyPlayer = null;
let globalDeviceId: null | string = null;
let isInitializing = false;

export function SpotifyPlayerProvider({
  children,
}: SpotifyPlayerProviderProps) {
  const [player, setPlayer] = useState<null | SpotifyPlayer>(globalPlayer);
  const [deviceId, setDeviceId] = useState<null | string>(globalDeviceId);
  const [currentTrack, setCurrentTrack] = useState<null | SpotifyTrack>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [isReady, setIsReady] = useState(false);
  const [currentTrackList, setCurrentTrackList] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTracksWithIds, setCurrentTracksWithIds] = useState<
    TrackWithId[]
  >([]);
  const [currentContext, setCurrentContext] = useState<null | PlayContext>(
    null,
  );
  const previousStateRef = useRef<null | SpotifyPlayerState>(null);
  const shouldAutoPlayNext = useRef(false);
  const isMountedRef = useRef(true);
  const attachedPlayerRef = useRef<null | SpotifyPlayer>(null);
  const listenersRef = useRef<
    { event: string; handler: (data?: unknown) => void }[]
  >([]);
  const { data: user } = useAuthControllerGetProfile();
  const {
    clearPlayTrackingTimer,
    onPlayRecordedCallbackRef,
    pausePlayTracking,
    resumePlayTracking,
    startPlayTracking,
  } = usePlayTracking();
  const { fetchAllTracksForContext, getAccessToken } = useSpotifyAPI();
  const shuffleManager = useShuffleManager();

  // Helper to add listener and track it for cleanup
  const addTrackedListener = useCallback(
    (
      playerInstance: SpotifyPlayer,
      event: string,
      handler: (data?: unknown) => void,
    ) => {
      playerInstance.addListener(event, handler);
      listenersRef.current.push({ event, handler });
    },
    [],
  );

  // Helper to remove all tracked listeners
  const removeAllListeners = useCallback((playerInstance: SpotifyPlayer) => {
    listenersRef.current.forEach(({ event, handler }) => {
      playerInstance.removeListener(event, handler);
    });
    listenersRef.current = [];
  }, []);

  // Attach all player event listeners
  const attachPlayerListeners = useCallback(
    (playerInstance: SpotifyPlayer) => {
      const initErrorHandler = () => {
        isInitializing = false;
      };

      const playerStateChangedHandler = async (data: unknown) => {
        if (!isMountedRef.current) return; // Guard against unmounted updates

        const state = data as null | SpotifyPlayerState;
        if (!state) return;

        const newTrack = state.track_window.current_track;
        const wasPlaying = isPlaying;
        const newIsPlaying = !state.paused;
        const previousState = previousStateRef.current;

        if (
          previousState &&
          !previousState.paused &&
          state.paused &&
          state.position === 0
        ) {
          shouldAutoPlayNext.current = true;
        }

        previousStateRef.current = state;

        if (!isMountedRef.current) return; // Double-check before state updates

        setCurrentTrack(newTrack);
        setIsPlaying(newIsPlaying);
        setPosition(state.position);
        setDuration(newTrack.duration_ms);

        if (newIsPlaying && !wasPlaying) {
          resumePlayTracking();
        } else if (!newIsPlaying && wasPlaying) {
          pausePlayTracking();
        }
      };

      const readyHandler = (data: unknown) => {
        if (!isMountedRef.current) return;

        const { device_id } = data as { device_id: string };

        // Store in global variables to survive hot-reloads
        globalDeviceId = device_id;
        globalPlayer = playerInstance;
        isInitializing = false;

        setDeviceId(device_id);
        setIsReady(true);
      };

      const notReadyHandler = () => {
        if (!isMountedRef.current) return;
        setIsReady(false);
      };

      // Add all listeners using the tracked helper
      addTrackedListener(
        playerInstance,
        "initialization_error",
        initErrorHandler,
      );
      addTrackedListener(
        playerInstance,
        "authentication_error",
        initErrorHandler,
      );
      addTrackedListener(playerInstance, "account_error", initErrorHandler);
      addTrackedListener(
        playerInstance,
        "player_state_changed",
        playerStateChangedHandler,
      );
      addTrackedListener(playerInstance, "ready", readyHandler);
      addTrackedListener(playerInstance, "not_ready", notReadyHandler);
    },
    [addTrackedListener, isPlaying, pausePlayTracking, resumePlayTracking],
  );

  useEffect(() => {
    if (!user) return;

    isMountedRef.current = true;

    const initializePlayer = () => {
      // If we already have a global player, reuse it
      if (globalPlayer && globalDeviceId) {
        // Remove any stale listeners before reusing
        removeAllListeners(globalPlayer);

        setPlayer(globalPlayer);
        attachedPlayerRef.current = globalPlayer;
        setDeviceId(globalDeviceId);
        setIsReady(true);

        // Re-attach fresh listeners to the existing player
        attachPlayerListeners(globalPlayer);
        return;
      }

      // Prevent double initialization (React Strict Mode)
      if (isInitializing) {
        return;
      }

      isInitializing = true;
      const spotifyPlayer = new window.Spotify.Player({
        getOAuthToken: (cb) => {
          getAccessToken()
            .then((token) => cb(token))
            .catch(() => cb(""));
        },
        name: "Spotlib Web Player",
        volume,
      });

      // Attach all event listeners
      attachPlayerListeners(spotifyPlayer);

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
      attachedPlayerRef.current = spotifyPlayer;
    };
    const checkAndInitialize = () => {
      if (window.Spotify) {
        initializePlayer();
      } else if (
        (window as unknown as { spotifySDKReady?: boolean }).spotifySDKReady
      ) {
        setTimeout(checkAndInitialize, 100);
      }
    };
    checkAndInitialize();
    const originalCallback = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      if (originalCallback) originalCallback();
      checkAndInitialize();
    };
    return () => {
      isMountedRef.current = false;
      clearPlayTrackingTimer();

      // Remove listeners on cleanup to prevent memory leaks
      if (attachedPlayerRef.current) {
        removeAllListeners(attachedPlayerRef.current);
      }

      // Don't disconnect the player - let it survive for hot-reload
    };
  }, [user]);
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (player) {
        player.getCurrentState().then((state) => {
          if (state) setPosition(state.position);
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, player]);
  useEffect(() => {
    if (
      shouldAutoPlayNext.current &&
      currentTrackList.length > 0 &&
      player &&
      deviceId
    ) {
      shouldAutoPlayNext.current = false;
      const nextIndex = currentTrackIndex + 1;
      if (nextIndex < currentTrackList.length) {
        setTimeout(async () => {
          clearPlayTrackingTimer();
          const nextUri = currentTrackList[nextIndex];
          try {
            const response = await fetch(
              `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
              {
                body: JSON.stringify({ uris: [nextUri] }),
                headers: {
                  "Authorization": `Bearer ${await getAccessToken()}`,
                  "Content-Type": "application/json",
                },
                method: "PUT",
              },
            );
            if (response.ok) {
              setCurrentTrackIndex(nextIndex);
              const nextTrackWithId = currentTracksWithIds[nextIndex];
              if (nextTrackWithId?.trackId) {
                startPlayTracking(
                  nextTrackWithId.trackId,
                  onPlayRecordedCallbackRef.current || undefined,
                );
              }
            }
          } catch {
            // Silently fail auto-play
          }
        }, 100);
      }
    }
  }, [
    isPlaying,
    currentTrackList,
    currentTrackIndex,
    player,
    deviceId,
    currentTracksWithIds,
  ]);
  const play = async (uri?: string) => {
    if (!player || !deviceId) return;
    if (uri) {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          body: JSON.stringify({ uris: [uri] }),
          headers: {
            "Authorization": `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json",
          },
          method: "PUT",
        },
      );
      if (response.ok) {
        setCurrentTrackList([uri]);
        setCurrentTrackIndex(0);
      }
    } else {
      await player.resume();
    }
  };
  const playTrackList = async (
    tracks: string[] | TrackWithId[],
    startIndex = 0,
    context?: PlayContext,
    onPlayRecorded?: () => void,
  ) => {
    if (!player || !deviceId || tracks.length === 0) return;
    const normalizedTracks: TrackWithId[] = tracks.map((track) => {
      if (typeof track === "string") return { spotifyUri: track };
      return track;
    });
    const trackUris = normalizedTracks.map((track) => track.spotifyUri);

    const token = await getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        body: JSON.stringify({
          offset: { position: startIndex },
          uris: trackUris,
        }),
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "PUT",
      },
    );

    if (response.ok || response.status === 204) {
      setCurrentTrackList(trackUris);
      setCurrentTrackIndex(startIndex);
      shuffleManager.setOriginalTrackList(trackUris);
      setCurrentTracksWithIds(normalizedTracks);
      shuffleManager.setIsShuffled(false);
      setCurrentContext(context || null);
      const startingTrack = normalizedTracks[startIndex];
      if (startingTrack?.trackId) {
        startPlayTracking(startingTrack.trackId, onPlayRecorded);
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || "Failed to play track");
    }
  };
  const pause = async () => {
    if (player) await player.pause();
  };
  const resume = async () => {
    if (player) await player.resume();
  };
  const nextTrack = async () => {
    if (!player || currentTrackList.length === 0) return;
    clearPlayTrackingTimer();
    const nextIndex = currentTrackIndex + 1;
    if (nextIndex < currentTrackList.length) {
      const nextUri = currentTrackList[nextIndex];
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          body: JSON.stringify({ uris: [nextUri] }),
          headers: {
            "Authorization": `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json",
          },
          method: "PUT",
        },
      );
      if (response.ok) {
        setCurrentTrackIndex(nextIndex);
        const nextTrackWithId = currentTracksWithIds[nextIndex];
        if (nextTrackWithId?.trackId) {
          startPlayTracking(
            nextTrackWithId.trackId,
            onPlayRecordedCallbackRef.current || undefined,
          );
        }
      }
    } else {
      await player.nextTrack();
    }
  };
  const previousTrack = async () => {
    if (!player || currentTrackList.length === 0) return;
    clearPlayTrackingTimer();
    const prevIndex = currentTrackIndex - 1;
    if (prevIndex >= 0) {
      const prevUri = currentTrackList[prevIndex];
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          body: JSON.stringify({ uris: [prevUri] }),
          headers: {
            "Authorization": `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json",
          },
          method: "PUT",
        },
      );
      if (response.ok) {
        setCurrentTrackIndex(prevIndex);
        const prevTrackWithId = currentTracksWithIds[prevIndex];
        if (prevTrackWithId?.trackId) {
          startPlayTracking(
            prevTrackWithId.trackId,
            onPlayRecordedCallbackRef.current || undefined,
          );
        }
      }
    } else {
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
    setVolumeState(newVolume);
    if (player) {
      await player.setVolume(newVolume);
    }
  };
  const handleToggleShuffle = async () => {
    await shuffleManager.toggleShuffle(
      currentTrackList,
      currentTrackIndex,
      currentContext,
      setCurrentTrackList,
      setCurrentTrackIndex,
      () => fetchAllTracksForContext(currentContext, currentTrackList),
    );
  };
  const contextValue: SpotifyPlayerContextType = {
    currentContext,
    currentTrack,
    currentTrackIndex,
    currentTrackList,
    deviceId,
    duration,
    isPlaying,
    isReady,
    isShuffled: shuffleManager.isShuffled,
    nextTrack,
    originalTrackList: shuffleManager.originalTrackList,
    pause,
    play,
    player,
    playTrackList,
    position,
    previousTrack,
    resume,
    seek,
    setVolume,
    toggleShuffle: handleToggleShuffle,
    volume,
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
    throw new Error(
      "useSpotifyPlayer must be used within a SpotifyPlayerProvider",
    );
  }
  return context;
}
