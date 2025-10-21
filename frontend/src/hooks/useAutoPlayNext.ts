import { useEffect } from "react";

import { SpotifyPlayer } from "../types/spotify";

interface TrackWithId {
  spotifyUri: string;
  trackId?: string;
}

interface UseAutoPlayNextParams {
  clearPlayTrackingTimer: () => void;
  currentTrackIndex: number;
  currentTrackList: string[];
  currentTracksWithIds: TrackWithId[];
  deviceId: null | string;
  getAccessToken: () => Promise<string>;
  isPlaying: boolean;
  onPlayRecordedCallbackRef: React.MutableRefObject<(() => void) | null>;
  player: null | SpotifyPlayer;
  setCurrentTrackIndex: (index: number) => void;
  shouldAutoPlayNext: React.MutableRefObject<boolean>;
  startPlayTracking: (trackId: string, onPlayRecorded?: () => void) => void;
}

export function useAutoPlayNext(params: UseAutoPlayNextParams) {
  const {
    clearPlayTrackingTimer,
    currentTrackIndex,
    currentTrackList,
    currentTracksWithIds,
    deviceId,
    getAccessToken,
    isPlaying,
    onPlayRecordedCallbackRef,
    player,
    setCurrentTrackIndex,
    shouldAutoPlayNext,
    startPlayTracking,
  } = params;

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
}
