import { notifications } from "@mantine/notifications";
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

import { FullscreenContent } from "@/components/fullscreen/FullscreenContent";
import { FullscreenEmptyState } from "@/components/fullscreen/FullscreenEmptyState";
import { FullscreenHeader } from "@/components/fullscreen/FullscreenHeader";
import { FullscreenLoadingState } from "@/components/fullscreen/FullscreenLoadingState";
import { OnboardingProgress } from "@/components/fullscreen/OnboardingProgress";
import { SEED_PLAYLISTS } from "@/constants/seedPlaylists";
import { usePlaylistsControllerCreate } from "@/data/api";
import { useFullscreenKeyboard } from "@/hooks/useFullscreenKeyboard";
import { useFullscreenPlayback } from "@/hooks/useFullscreenPlayback";
import { useLibraryTrack } from "@/hooks/useLibraryTrack";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTrackRatingMutation } from "@/hooks/useTrackRatingMutation";
import { trackEvent } from "@/lib/posthog";

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
    handleNext,
    handlePlayPause,
    handlePrevious,
    isRemotePlayback,
    remoteDevice,
    remoteTrack,
  } = useFullscreenPlayback();

  const createPlaylistMutation = usePlaylistsControllerCreate();

  // Use Spotify's current track for spotifyId - Spotify manages the queue
  const spotifyId =
    currentTrack?.linked_from?.id || currentTrack?.id || remoteTrack?.id || "";

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
    } catch (err) {
      console.error("Failed to create seed playlists:", err); // eslint-disable-line no-console
      notifications.show({
        color: "red",
        message: "Failed to create playlists. Please try again.",
        title: "Error",
      });
      isCompletingRef.current = false;
      return;
    }
    // Post-creation actions - playlists created successfully at this point
    trackEvent("onboarding_playlists_created", {
      playlistCount: SEED_PLAYLISTS.length,
    });
    trackEvent("onboarding_completed", { path: "rating" });
    onboarding?.exitOnboarding();
    navigate({ search: { welcome: true }, to: "/smart-playlists" });
    isCompletingRef.current = false;
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
            try {
              trackEvent(
                isOnboarding ? "onboarding_track_rated" : "track_rated",
                isOnboarding
                  ? { rating, trackIndex: currentTrackIndex + 1 }
                  : { rating, source: "fullscreen_mode" },
              );
              await new Promise((r) => setTimeout(r, 500));
              if (isOnboarding) {
                // Use currentTrackIndex from Spotify player
                const isLast =
                  currentTrackIndex >= (onboarding?.totalTracks ?? 0) - 1;
                onboarding?.advance(rating);
                if (isLast) {
                  trackEvent("onboarding_rating_completed", {
                    ratings: [...(onboarding?.ratings ?? []), rating],
                  });
                  await completeOnboarding();
                } else {
                  await handleNext();
                }
              } else {
                await handleNext();
              }
            } finally {
              isAdvancingRef.current = false;
            }
          },
        },
      );
    },
    [
      libraryTrack,
      isOnboarding,
      onboarding,
      currentTrackIndex,
      updateRatingMutation,
      handleNext,
      completeOnboarding,
    ],
  );

  useFullscreenKeyboard({
    isRatingPending: updateRatingMutation.isPending,
    libraryTrack,
    onClose: handleClose,
    onNext: handleNext,
    onPlayPause: handlePlayPause,
    onPrevious: handlePrevious,
    onRating: handleRating,
  });

  useEffect(() => {
    trackEvent(
      isOnboarding
        ? "onboarding_fullscreen_entered"
        : "fullscreen_mode_entered",
    );
  }, [isOnboarding]);

  // Loading/empty states
  if (isOnboarding && !libraryTrack) {
    return <FullscreenLoadingState closeText="Skip" onClose={handleClose} />;
  }
  if (!isOnboarding && !currentTrack && !isRemotePlayback) {
    return <FullscreenEmptyState onClose={handleClose} />;
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col py-4 overflow-y-auto">
      <FullscreenHeader
        closeText={isOnboarding ? "Skip" : undefined}
        onClose={handleClose}
      />
      {isOnboarding && (
        <OnboardingProgress
          currentIndex={currentTrackIndex}
          totalTracks={onboarding?.totalTracks ?? 1}
        />
      )}
      <FullscreenContent
        currentTrack={currentTrack}
        isLoading={isLoading}
        isOnboarding={isOnboarding}
        isRemotePlayback={!!isRemotePlayback}
        libraryTrack={libraryTrack}
        onLibraryTrackUpdate={handleLibraryTrackUpdate}
        onRating={handleRating}
        remoteDevice={remoteDevice}
        remoteTrack={remoteTrack}
      />
    </div>
  );
}
