import { Badge, Center, Loader, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

import { FullscreenHeader } from "@/components/fullscreen/FullscreenHeader";
import { FullscreenSpotifyTrackView } from "@/components/fullscreen/FullscreenSpotifyTrackView";
import { FullscreenTrackView } from "@/components/fullscreen/FullscreenTrackView";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import {
  usePlaybackControllerNext,
  usePlaybackControllerPause,
  usePlaybackControllerPrevious,
  usePlaybackControllerResume,
} from "@/data/api";
import { useCurrentPlayback } from "@/hooks/useCurrentPlayback";
import { useLibraryTrack } from "@/hooks/useLibraryTrack";
import { useTrackRatingMutation } from "@/hooks/useTrackRatingMutation";
import { trackEvent } from "@/lib/posthog";

const SHORTCUTS_TEXT =
  "1-5 = Full Stars · Shift+1-5 = Half Stars · Space = Play/Pause · N = Next · P = Previous · Esc = Back";

export const Route = createFileRoute("/fullscreen")({
  component: FullscreenPage,
});

function FullscreenPage() {
  const router = useRouter();
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    nextTrack,
    pause,
    previousTrack,
    resume,
  } = useSpotifyPlayer();

  // Get polled playback for cross-device support
  const { currentPlayback, refetch: refetchPlayback } = useCurrentPlayback();

  // Remote playback API controls
  const { mutate: remoteNext } = usePlaybackControllerNext();
  const { mutate: remotePrevious } = usePlaybackControllerPrevious();
  const { mutate: remotePause } = usePlaybackControllerPause();
  const { mutate: remoteResume } = usePlaybackControllerResume();

  // Determine if we're playing on a remote device (not the web player)
  const isRemotePlayback = !currentTrack && currentPlayback?.track;
  const remoteTrack = currentPlayback?.track;
  const remoteDevice = currentPlayback?.device;

  // Get Spotify ID from either web player or remote playback
  const originalSpotifyId = currentTrack
    ? currentTrack.linked_from?.id || currentTrack.id || ""
    : remoteTrack?.id || "";

  const { isLoading, libraryTrack, refetchLibraryTrack } = useLibraryTrack({
    spotifyId: originalSpotifyId,
  });

  const updateRatingMutation = useTrackRatingMutation();
  const isAdvancingRef = useRef(false);

  const handleClose = useCallback(() => {
    trackEvent("fullscreen_mode_exited");
    router.history.back();
  }, [router]);

  const handleNext = useCallback(async () => {
    if (isRemotePlayback) {
      remoteNext(undefined, {
        onSuccess: () => {
          setTimeout(() => refetchPlayback(), 500);
        },
      });
    } else {
      await nextTrack();
    }
  }, [isRemotePlayback, nextTrack, refetchPlayback, remoteNext]);

  const handlePrevious = useCallback(async () => {
    if (isRemotePlayback) {
      remotePrevious(undefined, {
        onSuccess: () => {
          setTimeout(() => refetchPlayback(), 500);
        },
      });
    } else {
      await previousTrack();
    }
  }, [isRemotePlayback, previousTrack, refetchPlayback, remotePrevious]);

  const handlePlayPause = useCallback(() => {
    if (isRemotePlayback) {
      if (currentPlayback?.isPlaying) {
        remotePause(undefined, { onSuccess: () => refetchPlayback() });
      } else {
        remoteResume(undefined, { onSuccess: () => refetchPlayback() });
      }
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

  const handleLibraryTrackUpdate = async () => {
    await refetchLibraryTrack();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isInputElement) return;

      // Rating shortcuts: 1-5 for full stars, Shift+1-5 for half stars
      const digitMatch = e.code.match(/^Digit([1-5])$/);
      if (digitMatch && libraryTrack) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (updateRatingMutation.isPending) return;

        e.preventDefault();

        const baseRating = parseInt(digitMatch[1]);
        const rating = e.shiftKey ? baseRating - 0.5 : baseRating;
        updateRatingMutation.mutate(
          { data: { rating }, trackId: libraryTrack.id },
          {
            onError: (error) => {
              // eslint-disable-next-line no-console
              console.error("Failed to update track rating:", error);
              notifications.show({
                color: "red",
                message:
                  "Failed to save rating. Please try again or skip to the next track.",
                title: "Rating Error",
              });
            },
            onSuccess: async () => {
              if (isAdvancingRef.current) return;
              isAdvancingRef.current = true;
              try {
                trackEvent("track_rated", {
                  rating,
                  source: "fullscreen_mode",
                });
                await new Promise((resolve) => setTimeout(resolve, 500));
                await handleNext();
              } finally {
                isAdvancingRef.current = false;
              }
            },
          },
        );
      }

      if (e.key === " ") {
        e.preventDefault();
        handlePlayPause();
      }
      if (e.key === "n" || e.key === "ArrowRight") handleNext();
      if (e.key === "p" || e.key === "ArrowLeft") handlePrevious();
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    libraryTrack,
    updateRatingMutation,
    handlePrevious,
    handleNext,
    handleClose,
    handlePlayPause,
  ]);

  // Track fullscreen mode entry
  useEffect(() => trackEvent("fullscreen_mode_entered"), []);

  // No track playing on web player or remote device - show message
  if (!currentTrack && !isRemotePlayback) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col py-4">
        <FullscreenHeader onClose={handleClose} />
        <Center className="flex-1">
          <Stack align="center" gap="md">
            <Text className="text-dark-2" size="xl">
              No track is currently playing
            </Text>
            <Text className="text-dark-3" size="sm">
              Start playing something to see it in fullscreen mode
            </Text>
          </Stack>
        </Center>
      </div>
    );
  }

  // Remote playback (playing on another device)
  if (isRemotePlayback && remoteTrack) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col py-4 overflow-y-auto">
        <FullscreenHeader onClose={handleClose} />

        <div className="flex-1 flex flex-col items-center px-4 md:px-8 pb-4 gap-2 min-h-0">
          {remoteDevice && (
            <Badge color="blue" size="lg" variant="light">
              Playing on {remoteDevice.name}
            </Badge>
          )}
          <Text className="text-dark-3 text-center text-xs md:text-sm hidden md:block">
            <strong>Shortcuts:</strong> {SHORTCUTS_TEXT}
          </Text>

          {isLoading ? (
            <Loader color="orange" size="xl" />
          ) : libraryTrack ? (
            <FullscreenTrackView
              libraryTrack={libraryTrack}
              onLibraryTrackUpdate={handleLibraryTrackUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          ) : (
            <FullscreenSpotifyTrackView
              currentTrackIndex={0}
              onNext={handleNext}
              onPrevious={handlePrevious}
              track={{
                album: {
                  images: remoteTrack.album.images.map((url) => ({ url })),
                  name: remoteTrack.album.name,
                },
                artists: remoteTrack.artists.map((a) => ({ name: a.name })),
                name: remoteTrack.name,
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Web player playback (currentTrack exists)
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col py-4 overflow-y-auto">
      <FullscreenHeader onClose={handleClose} />

      <div className="flex-1 flex flex-col items-center px-4 md:px-8 pb-4 gap-2 min-h-0">
        <Text className="text-dark-3 text-center text-xs md:text-sm hidden md:block">
          <strong>Shortcuts:</strong> {SHORTCUTS_TEXT}
        </Text>

        {isLoading ? (
          <Loader color="orange" size="xl" />
        ) : libraryTrack ? (
          <FullscreenTrackView
            currentTrackIndex={currentTrackIndex}
            libraryTrack={libraryTrack}
            onLibraryTrackUpdate={handleLibraryTrackUpdate}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        ) : currentTrack ? (
          <FullscreenSpotifyTrackView
            currentTrackIndex={currentTrackIndex}
            onNext={handleNext}
            onPrevious={handlePrevious}
            track={currentTrack}
          />
        ) : null}
      </div>
    </div>
  );
}
