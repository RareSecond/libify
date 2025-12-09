import { useCallback } from "react";

import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import {
  usePlaybackControllerNext,
  usePlaybackControllerPause,
  usePlaybackControllerPrevious,
  usePlaybackControllerResume,
} from "@/data/api";
import { useCurrentPlayback } from "@/hooks/useCurrentPlayback";

interface OnboardingContext {
  currentIndex: number;
  tracks: { spotifyId?: string }[];
}

interface UseFullscreenPlaybackProps {
  isOnboarding: boolean;
  onboarding: null | OnboardingContext;
}

export function useFullscreenPlayback({
  isOnboarding,
  onboarding,
}: UseFullscreenPlaybackProps) {
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    nextTrack,
    pause,
    play,
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
    if (isOnboarding) {
      const next = onboarding?.tracks[(onboarding?.currentIndex ?? 0) + 1];
      if (next?.spotifyId) await play(`spotify:track:${next.spotifyId}`);
    } else if (isRemotePlayback) {
      remoteNext(undefined, {
        onSuccess: () => setTimeout(() => refetchPlayback(), 500),
      });
    } else {
      await nextTrack();
    }
  }, [isOnboarding, onboarding, play, isRemotePlayback, nextTrack, refetchPlayback, remoteNext]);

  const handlePrevious = useCallback(async () => {
    if (isOnboarding) {
      const prev = onboarding?.tracks[Math.max(0, (onboarding?.currentIndex ?? 0) - 1)];
      if (prev?.spotifyId) await play(`spotify:track:${prev.spotifyId}`);
    } else if (isRemotePlayback) {
      remotePrevious(undefined, {
        onSuccess: () => setTimeout(() => refetchPlayback(), 500),
      });
    } else {
      await previousTrack();
    }
  }, [isOnboarding, onboarding, play, isRemotePlayback, previousTrack, refetchPlayback, remotePrevious]);

  const handlePlayPause = useCallback(() => {
    if (isRemotePlayback) {
      if (currentPlayback?.isPlaying) remotePause(undefined, { onSuccess: () => refetchPlayback() });
      else remoteResume(undefined, { onSuccess: () => refetchPlayback() });
    } else {
      if (isPlaying) pause();
      else resume();
    }
  }, [isRemotePlayback, currentPlayback?.isPlaying, isPlaying, pause, resume, remotePause, remoteResume, refetchPlayback]);

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
