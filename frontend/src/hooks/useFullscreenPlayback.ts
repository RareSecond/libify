import { useCallback } from "react";

import {
  usePlaybackControllerNext,
  usePlaybackControllerPause,
  usePlaybackControllerPrevious,
  usePlaybackControllerResume,
} from "@/data/api";
import { useCurrentPlayback } from "@/hooks/useCurrentPlayback";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

export function useFullscreenPlayback() {
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    nextTrack,
    pause,
    previousTrack,
    resume,
  } = useSpotifyPlayer();
  const { currentPlayback, refetch: refetchPlayback } = useCurrentPlayback();

  const { mutate: remoteNext } = usePlaybackControllerNext();
  const { mutate: remotePrevious } = usePlaybackControllerPrevious();
  const { mutate: remotePause } = usePlaybackControllerPause();
  const { mutate: remoteResume } = usePlaybackControllerResume();

  const isRemotePlayback = !currentTrack && currentPlayback?.track;
  const remoteTrack = currentPlayback?.track;
  const remoteDevice = currentPlayback?.device;

  const handleNext = useCallback(async () => {
    if (isRemotePlayback) {
      remoteNext(undefined, {
        onSuccess: () => setTimeout(() => refetchPlayback(), 500),
      });
    } else {
      await nextTrack();
    }
  }, [isRemotePlayback, nextTrack, refetchPlayback, remoteNext]);

  const handlePrevious = useCallback(async () => {
    if (isRemotePlayback) {
      remotePrevious(undefined, {
        onSuccess: () => setTimeout(() => refetchPlayback(), 500),
      });
    } else {
      await previousTrack();
    }
  }, [isRemotePlayback, previousTrack, refetchPlayback, remotePrevious]);

  const handlePlayPause = useCallback(() => {
    if (isRemotePlayback) {
      if (currentPlayback?.isPlaying)
        remotePause(undefined, { onSuccess: () => refetchPlayback() });
      else remoteResume(undefined, { onSuccess: () => refetchPlayback() });
    } else {
      if (isPlaying) pause();
      else resume();
    }
  }, [
    isRemotePlayback,
    currentPlayback?.isPlaying,
    isPlaying,
    pause,
    resume,
    remotePause,
    remoteResume,
    refetchPlayback,
  ]);

  return {
    currentPlayback,
    currentTrack,
    currentTrackIndex,
    handleNext,
    handlePlayPause,
    handlePrevious,
    isRemotePlayback,
    remoteDevice,
    remoteTrack,
  };
}
