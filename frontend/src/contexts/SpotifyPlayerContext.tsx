import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useAuthControllerGetProfile,
  useLibraryControllerRecordPlay,
} from "../data/api";
import {
  SpotifyPlayer,
  SpotifyPlayerState,
  SpotifyTrack,
} from "../types/spotify";

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
  trackId?: string; // Internal track ID for play recording
}

const SpotifyPlayerContext = createContext<null | SpotifyPlayerContextType>(
  null,
);

interface SpotifyPlayerProviderProps {
  children: ReactNode;
}

export function SpotifyPlayerProvider({
  children,
}: SpotifyPlayerProviderProps) {
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
  const [originalTrackList, setOriginalTrackList] = useState<string[]>([]);
  const [currentTracksWithIds, setCurrentTracksWithIds] = useState<
    TrackWithId[]
  >([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [currentContext, setCurrentContext] = useState<null | PlayContext>(
    null,
  );

  // Play tracking state
  const [playTrackingTimer, setPlayTrackingTimer] = useState<null | number>(
    null,
  );
  const [currentTrackId, setCurrentTrackId] = useState<null | string>(null);
  const [playStartTime, setPlayStartTime] = useState<null | number>(null);
  const onPlayRecordedCallbackRef = useRef<(() => void) | null>(null);

  // Track previous state to detect track end
  const previousStateRef = useRef<null | SpotifyPlayerState>(null);
  const shouldAutoPlayNext = useRef(false);

  const { data: user } = useAuthControllerGetProfile();
  const recordPlayMutation = useLibraryControllerRecordPlay();

  // Helper functions for play tracking
  const clearPlayTrackingTimer = () => {
    if (playTrackingTimer) {
      window.clearTimeout(playTrackingTimer);
      setPlayTrackingTimer(null);
    }
    setCurrentTrackId(null);
    setPlayStartTime(null);
    onPlayRecordedCallbackRef.current = null;
  };

  const startPlayTracking = (trackId: string, onPlayRecorded?: () => void) => {
    // Clear any existing timer
    clearPlayTrackingTimer();

    // Set up new tracking
    setCurrentTrackId(trackId);
    setPlayStartTime(Date.now());
    onPlayRecordedCallbackRef.current = onPlayRecorded || null;

    // Start 30-second timer
    const timerId = window.setTimeout(async () => {
      try {
        if (recordPlayMutation?.mutateAsync) {
          await recordPlayMutation.mutateAsync({ trackId });
          // Call the callback to update UI
          if (onPlayRecorded) {
            onPlayRecorded();
          }
        }
      } catch {
        // Silently fail - don't interrupt the user experience
      } finally {
        // Clear tracking state after recording
        setPlayTrackingTimer(null);
        setCurrentTrackId(null);
        setPlayStartTime(null);
        onPlayRecordedCallbackRef.current = null;
      }
    }, 30000); // 30 seconds

    setPlayTrackingTimer(timerId);
  };

  useEffect(() => {
    if (!user) return;

    const initializePlayer = () => {
      const spotifyPlayer = new window.Spotify.Player({
        getOAuthToken: (cb) => {
          fetch(`${import.meta.env.VITE_API_URL}/auth/token`, {
            credentials: "include",
          })
            .then((response) => response.json())
            .then((data) => cb(data.accessToken))
            .catch(() => cb(""));
        },
        name: "Spotlib Web Player",
        volume,
      });

      // Error handling
      spotifyPlayer.addListener("initialization_error", () => {
        // Handle initialization error silently
      });

      spotifyPlayer.addListener("authentication_error", () => {
        // Handle authentication error silently
      });

      spotifyPlayer.addListener("account_error", () => {
        // Handle account validation error silently
      });

      // Playback status updates
      spotifyPlayer.addListener("player_state_changed", async (data) => {
        const state = data as null | SpotifyPlayerState;
        if (!state) return;

        const newTrack = state.track_window.current_track;
        const wasPlaying = isPlaying;
        const newIsPlaying = !state.paused;
        const previousState = previousStateRef.current;

        // Detect track end: track was playing, now paused at position 0
        if (
          previousState &&
          !previousState.paused &&
          state.paused &&
          state.position === 0
        ) {
          // Track ended naturally, set flag to auto-play next
          shouldAutoPlayNext.current = true;
        }

        // Update previous state reference
        previousStateRef.current = state;

        setCurrentTrack(newTrack);
        setIsPlaying(newIsPlaying);
        setPosition(state.position);
        setDuration(newTrack.duration_ms);

        // Handle play tracking based on state changes
        if (newIsPlaying && !wasPlaying) {
          // Started playing - check if we have a track ID to track
          if (currentTrackId) {
            // Resume tracking if we have a current track ID
            const elapsed = playStartTime ? Date.now() - playStartTime : 0;
            const remainingTime = Math.max(0, 30000 - elapsed);

            if (remainingTime > 0 && !playTrackingTimer) {
              // Resume timer with remaining time
              const timerId = window.setTimeout(async () => {
                try {
                  if (recordPlayMutation?.mutateAsync) {
                    await recordPlayMutation.mutateAsync({
                      trackId: currentTrackId,
                    });
                    // Call the callback to update UI
                    if (onPlayRecordedCallbackRef.current) {
                      onPlayRecordedCallbackRef.current();
                    }
                  }
                } catch {
                  // Silently fail
                } finally {
                  setPlayTrackingTimer(null);
                  setCurrentTrackId(null);
                  setPlayStartTime(null);
                  onPlayRecordedCallbackRef.current = null;
                }
              }, remainingTime);
              setPlayTrackingTimer(timerId);
            }
          }
        } else if (!newIsPlaying && wasPlaying) {
          // Paused - pause the timer but keep the state
          if (playTrackingTimer) {
            window.clearTimeout(playTrackingTimer);
            setPlayTrackingTimer(null);
          }
        }
      });

      // Ready
      spotifyPlayer.addListener("ready", (data) => {
        const { device_id } = data as { device_id: string };
        // Device ready
        setDeviceId(device_id);
        setIsReady(true);
      });

      // Not Ready
      spotifyPlayer.addListener("not_ready", () => {
        // Device offline
        setIsReady(false);
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    // Check if SDK is already loaded or wait for it
    const checkAndInitialize = () => {
      if (window.Spotify) {
        initializePlayer();
      } else if (
        (window as unknown as { spotifySDKReady?: boolean }).spotifySDKReady
      ) {
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
      // Clear any pending play tracking timer
      clearPlayTrackingTimer();
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

  // Handle auto-play next track when a track ends
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
        // Small delay to ensure state is stable
        setTimeout(async () => {
          // Clear current play tracking since we're changing tracks
          clearPlayTrackingTimer();

          // Play next track in our list
          const nextUri = currentTrackList[nextIndex];
          try {
            const response = await fetch(
              `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
              {
                body: JSON.stringify({ uris: [nextUri] }),
                headers: {
                  Authorization: `Bearer ${await getAccessToken()}`,
                  "Content-Type": "application/json",
                },
                method: "PUT",
              },
            );

            if (response.ok) {
              setCurrentTrackIndex(nextIndex);
              // Start tracking for the new track if we have its ID
              const nextTrackWithId = currentTracksWithIds[nextIndex];
              if (nextTrackWithId?.trackId) {
                startPlayTracking(
                  nextTrackWithId.trackId,
                  onPlayRecordedCallbackRef.current || undefined,
                );
              }
            }
          } catch (error) {
            console.error("Failed to auto-play next track:", error);
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
  ]); // Trigger when isPlaying changes (track ended sets it to false)

  const play = async (uri?: string) => {
    if (!player || !deviceId) return;

    if (uri) {
      // Play specific track and reset track list to just this track
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          body: JSON.stringify({ uris: [uri] }),
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json",
          },
          method: "PUT",
        },
      );

      if (!response.ok) {
        // Failed to play track
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

  const playTrackList = async (
    tracks: string[] | TrackWithId[],
    startIndex = 0,
    context?: PlayContext,
    onPlayRecorded?: () => void,
  ) => {
    if (!player || !deviceId || tracks.length === 0) return;

    // Normalize tracks to TrackWithId format
    const normalizedTracks: TrackWithId[] = tracks.map((track) => {
      if (typeof track === "string") {
        return { spotifyUri: track };
      }
      return track;
    });

    const trackUris = normalizedTracks.map((track) => track.spotifyUri);

    const response = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        body: JSON.stringify({
          offset: { position: startIndex },
          uris: trackUris,
        }),
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
          "Content-Type": "application/json",
        },
        method: "PUT",
      },
    );

    if (!response.ok) {
      // Failed to play track list
    } else {
      setCurrentTrackList(trackUris);
      setCurrentTrackIndex(startIndex);
      setOriginalTrackList(trackUris);
      setCurrentTracksWithIds(normalizedTracks);
      setIsShuffled(false);
      setCurrentContext(context || null);

      // Start tracking the play for the starting track
      const startingTrack = normalizedTracks[startIndex];
      if (startingTrack?.trackId) {
        startPlayTracking(startingTrack.trackId, onPlayRecorded);
      }
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

    // Clear current play tracking since we're changing tracks
    clearPlayTrackingTimer();

    const nextIndex = currentTrackIndex + 1;

    if (nextIndex < currentTrackList.length) {
      // Play next track in our list
      const nextUri = currentTrackList[nextIndex];
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          body: JSON.stringify({ uris: [nextUri] }),
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json",
          },
          method: "PUT",
        },
      );

      if (!response.ok) {
        // Failed to play next track
      } else {
        setCurrentTrackIndex(nextIndex);
        // Start tracking for the new track if we have its ID
        const nextTrackWithId = currentTracksWithIds[nextIndex];
        if (nextTrackWithId?.trackId) {
          startPlayTracking(
            nextTrackWithId.trackId,
            onPlayRecordedCallbackRef.current || undefined,
          );
        }
      }
    } else {
      // Try Spotify's native next (in case there's a queue)
      await player.nextTrack();
    }
  };

  const previousTrack = async () => {
    if (!player || currentTrackList.length === 0) return;

    // Clear current play tracking since we're changing tracks
    clearPlayTrackingTimer();

    const prevIndex = currentTrackIndex - 1;

    if (prevIndex >= 0) {
      // Play previous track in our list
      const prevUri = currentTrackList[prevIndex];
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          body: JSON.stringify({ uris: [prevUri] }),
          headers: {
            Authorization: `Bearer ${await getAccessToken()}`,
            "Content-Type": "application/json",
          },
          method: "PUT",
        },
      );

      if (!response.ok) {
        // Failed to play previous track
      } else {
        setCurrentTrackIndex(prevIndex);
        // Start tracking for the new track if we have its ID
        const prevTrackWithId = currentTracksWithIds[prevIndex];
        if (prevTrackWithId?.trackId) {
          startPlayTracking(
            prevTrackWithId.trackId,
            onPlayRecordedCallbackRef.current || undefined,
          );
        }
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
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/token`, {
      credentials: "include",
    });
    const data = await response.json();
    return data.accessToken;
  };

  // Fisher-Yates shuffle algorithm for true randomness
  const shuffleArray = (array: string[]): string[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchAllTracksForContext = async (): Promise<string[]> => {
    if (!currentContext || !currentContext.contextType) {
      return currentTrackList;
    }

    try {
      let allTracks: string[] = [];
      const baseUrl = `${import.meta.env.VITE_API_URL}/library`;

      switch (currentContext.contextType) {
        case "album": {
          if (currentContext.contextId) {
            // Album endpoint expects both artist and album in the URL
            const [artist, album] = currentContext.contextId.split("|");
            if (!artist || !album) {
              return currentTrackList;
            }

            const url = `${baseUrl}/albums/${encodeURIComponent(artist)}/${encodeURIComponent(album)}/tracks`;
            const response = await fetch(url, { credentials: "include" });

            if (!response.ok) {
              return currentTrackList;
            }

            const data = await response.json();

            // The response is an array of tracks
            allTracks = Array.isArray(data)
              ? data
                  .filter((track: { spotifyId?: string }) => track.spotifyId)
                  .map(
                    (track: { spotifyId: string }) =>
                      `spotify:track:${track.spotifyId}`,
                  )
              : [];
          }
          break;
        }

        case "artist": {
          if (currentContext.contextId) {
            const url = `${baseUrl}/artists/${encodeURIComponent(currentContext.contextId)}/tracks`;
            const response = await fetch(url, { credentials: "include" });

            if (!response.ok) {
              return currentTrackList;
            }

            const data = await response.json();

            // The response is an array of tracks
            allTracks = Array.isArray(data)
              ? data
                  .filter((track: { spotifyId?: string }) => track.spotifyId)
                  .map(
                    (track: { spotifyId: string }) =>
                      `spotify:track:${track.spotifyId}`,
                  )
              : [];
          }
          break;
        }

        case "library": {
          // For library, fetch all tracks (up to 1000)
          const searchParams = new URLSearchParams({
            page: "1",
            pageSize: "1000",
            sortBy: "addedAt",
            sortOrder: "desc",
          });

          // Add search parameter if present
          if (currentContext.search) {
            searchParams.append("search", currentContext.search);
          }

          const response = await fetch(
            `${baseUrl}/tracks?${searchParams.toString()}`,
            { credentials: "include" },
          );

          if (!response.ok) {
            // Failed to fetch library tracks
            return currentTrackList;
          }

          const data = await response.json();
          allTracks = data.tracks
            .filter((track: { spotifyId?: string }) => track.spotifyId)
            .map(
              (track: { spotifyId: string }) =>
                `spotify:track:${track.spotifyId}`,
            );
          break;
        }
      }

      return allTracks.length > 0 ? allTracks : currentTrackList;
    } catch {
      return currentTrackList;
    }
  };

  const toggleShuffle = async () => {
    if (!currentTrackList.length) return;

    if (isShuffled) {
      // Restore original order
      const currentTrackUri = currentTrackList[currentTrackIndex];
      const newIndex = originalTrackList.indexOf(currentTrackUri);
      setCurrentTrackList(originalTrackList);
      setCurrentTrackIndex(newIndex >= 0 ? newIndex : 0);
      setIsShuffled(false);
    } else {
      // Fetch all tracks from context if needed
      let tracksToShuffle = currentTrackList;

      if (currentContext && currentContext.contextType) {
        const allTracks = await fetchAllTracksForContext();

        if (allTracks.length > currentTrackList.length) {
          tracksToShuffle = allTracks;
          setOriginalTrackList(allTracks);
        } else {
          setOriginalTrackList(currentTrackList);
        }
      } else {
        setOriginalTrackList(currentTrackList);
      }

      // Shuffle the tracks
      const currentTrackUri = currentTrackList[currentTrackIndex];

      // Create shuffled array with current track at the beginning
      const remainingTracks = tracksToShuffle.filter(
        (uri) => uri !== currentTrackUri,
      );
      const shuffledRemaining = shuffleArray(remainingTracks);
      const shuffledList = [currentTrackUri, ...shuffledRemaining];

      setCurrentTrackList(shuffledList);
      setCurrentTrackIndex(0);
      setIsShuffled(true);
    }
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
    isShuffled,
    nextTrack,
    originalTrackList,
    pause,
    play,
    player,
    playTrackList,
    position,
    previousTrack,
    resume,
    seek,
    setVolume,
    toggleShuffle,
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
