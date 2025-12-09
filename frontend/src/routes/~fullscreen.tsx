import { Badge, Center, Loader, Progress, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

import { FullscreenHeader } from "@/components/fullscreen/FullscreenHeader";
import { FullscreenSpotifyTrackView } from "@/components/fullscreen/FullscreenSpotifyTrackView";
import { FullscreenTrackView } from "@/components/fullscreen/FullscreenTrackView";
import { SEED_PLAYLISTS } from "@/constants/seedPlaylists";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import {
  usePlaybackControllerNext,
  usePlaybackControllerPause,
  usePlaybackControllerPrevious,
  usePlaybackControllerResume,
  usePlaylistsControllerCreate,
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
  const navigate = useNavigate();
  const onboarding = useOnboarding();
  const isOnboarding = onboarding?.isOnboarding ?? false;

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
  const createPlaylistMutation = usePlaylistsControllerCreate();

  const isRemotePlayback = !currentTrack && currentPlayback?.track;
  const remoteTrack = currentPlayback?.track;
  const remoteDevice = currentPlayback?.device;

  // Get spotify ID from onboarding context OR current playback - same hook for both
  const spotifyId = isOnboarding
    ? onboarding?.tracks[onboarding.currentIndex]?.spotifyId || ""
    : currentTrack?.linked_from?.id ||
      currentTrack?.id ||
      remoteTrack?.id ||
      "";

  const { isLoading, libraryTrack, refetchLibraryTrack } = useLibraryTrack({
    spotifyId,
  });

  const updateRatingMutation = useTrackRatingMutation();
  const isAdvancingRef = useRef(false);
  const isCompletingRef = useRef(false);

  const handleLibraryTrackUpdate = useCallback(async () => {
    await refetchLibraryTrack();
  }, [refetchLibraryTrack]);

  const completeOnboarding = useCallback(async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    try {
      await Promise.all(
        SEED_PLAYLISTS.map((p) =>
          createPlaylistMutation.mutateAsync({ data: p }),
        ),
      );
      trackEvent("onboarding_playlists_created", {
        playlistCount: SEED_PLAYLISTS.length,
      });
      trackEvent("onboarding_completed", { path: "rating" });
      notifications.show({
        color: "green",
        message: "Check out your new smart playlists!",
        title: "Onboarding complete!",
      });
    } catch (err) {
      console.error("Failed to create seed playlists:", err); // eslint-disable-line no-console
    } finally {
      isCompletingRef.current = false;
      onboarding?.exitOnboarding();
      navigate({ to: "/playlists" });
    }
  }, [createPlaylistMutation, navigate, onboarding]);

  const handleClose = useCallback(() => {
    if (isOnboarding) {
      trackEvent("onboarding_rating_skipped");
      onboarding?.exitOnboarding();
      navigate({
        search: { genres: [], showRatingReminder: true },
        to: "/tracks",
      });
    } else {
      trackEvent("fullscreen_mode_exited");
      router.history.back();
    }
  }, [isOnboarding, onboarding, navigate, router]);

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
  }, [
    isOnboarding,
    onboarding,
    play,
    isRemotePlayback,
    nextTrack,
    refetchPlayback,
    remoteNext,
  ]);

  const handlePrevious = useCallback(async () => {
    if (isOnboarding) {
      const prev =
        onboarding?.tracks[Math.max(0, (onboarding?.currentIndex ?? 0) - 1)];
      if (prev?.spotifyId) await play(`spotify:track:${prev.spotifyId}`);
    } else if (isRemotePlayback) {
      remotePrevious(undefined, {
        onSuccess: () => setTimeout(() => refetchPlayback(), 500),
      });
    } else {
      await previousTrack();
    }
  }, [
    isOnboarding,
    onboarding,
    play,
    isRemotePlayback,
    previousTrack,
    refetchPlayback,
    remotePrevious,
  ]);

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

  const handleRating = useCallback(
    (rating: number) => {
      if (!libraryTrack || isAdvancingRef.current) return;
      isAdvancingRef.current = true;
      updateRatingMutation.mutate(
        { data: { rating }, trackId: libraryTrack.id },
        {
          onError: () => {
            notifications.show({
              color: "red",
              message: "Failed to save rating.",
              title: "Rating Error",
            });
            isAdvancingRef.current = false;
          },
          onSuccess: async () => {
            trackEvent(
              isOnboarding ? "onboarding_track_rated" : "track_rated",
              isOnboarding
                ? { rating, trackIndex: (onboarding?.currentIndex ?? 0) + 1 }
                : { rating, source: "fullscreen_mode" },
            );
            await new Promise((r) => setTimeout(r, 500));
            if (isOnboarding) {
              const isLast =
                (onboarding?.currentIndex ?? 0) >=
                (onboarding?.totalTracks ?? 0) - 1;
              await handleNext();
              onboarding?.advance(rating);
              if (isLast) {
                trackEvent("onboarding_rating_completed", {
                  ratings: onboarding?.ratings ?? [],
                });
                await completeOnboarding();
              }
            } else await handleNext();
            isAdvancingRef.current = false;
          },
        },
      );
    },
    [
      libraryTrack,
      isOnboarding,
      onboarding,
      updateRatingMutation,
      handleNext,
      completeOnboarding,
    ],
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const digitMatch = e.code.match(/^Digit([1-5])$/);
      if (digitMatch && libraryTrack && !updateRatingMutation.isPending) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        e.preventDefault();
        handleRating(
          e.shiftKey ? parseInt(digitMatch[1]) - 0.5 : parseInt(digitMatch[1]),
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
    updateRatingMutation.isPending,
    handleRating,
    handlePlayPause,
    handleNext,
    handlePrevious,
    handleClose,
  ]);

  useEffect(() => {
    trackEvent(
      isOnboarding
        ? "onboarding_fullscreen_entered"
        : "fullscreen_mode_entered",
    );
  }, [isOnboarding]);

  const progressPercent =
    (((onboarding?.currentIndex ?? 0) + 1) / (onboarding?.totalTracks ?? 1)) *
    100;

  // Loading/empty states
  if (isOnboarding && !libraryTrack) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col py-4">
        <FullscreenHeader closeText="Skip" onClose={handleClose} />
        <Center className="flex-1">
          <Loader color="orange" size="xl" />
        </Center>
      </div>
    );
  }
  if (!isOnboarding && !currentTrack && !isRemotePlayback) {
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

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col py-4 overflow-y-auto">
      <FullscreenHeader
        closeText={isOnboarding ? "Skip" : undefined}
        onClose={handleClose}
      />

      {isOnboarding && (
        <div className="px-4 md:px-8 py-2">
          <div className="flex items-center justify-between mb-2">
            <Text className="text-sm text-dark-1">
              Track {(onboarding?.currentIndex ?? 0) + 1} of{" "}
              {onboarding?.totalTracks}
            </Text>
            <Text className="text-sm text-dark-1">
              {Math.round(progressPercent)}%
            </Text>
          </div>
          <Progress color="orange" size="sm" value={progressPercent} />
        </div>
      )}
      <div className="flex-1 flex flex-col items-center px-4 md:px-8 pb-4 gap-2 min-h-0">
        {remoteDevice && !isOnboarding && (
          <Badge color="blue" size="lg" variant="light">
            Playing on {remoteDevice.name}
          </Badge>
        )}
        <Text className="text-dark-3 text-center text-xs md:text-sm hidden md:block">
          <strong>Shortcuts:</strong> {SHORTCUTS_TEXT}
        </Text>
        {isLoading && !isOnboarding ? (
          <Loader color="orange" size="xl" />
        ) : libraryTrack ? (
          <FullscreenTrackView
            currentTrackIndex={
              isOnboarding ? (onboarding?.currentIndex ?? 0) : currentTrackIndex
            }
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
        ) : isRemotePlayback && remoteTrack ? (
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
        ) : null}
      </div>
    </div>
  );
}
