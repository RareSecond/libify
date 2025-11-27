import { Loader, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  createFileRoute,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { RatingEmptyState } from "@/components/rating/RatingEmptyState";
import { RatingHeader } from "@/components/rating/RatingHeader";
import { RatingTrackView } from "@/components/rating/RatingTrackView";
import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useLibraryControllerGetTracks } from "@/data/api";
import { useLibraryTrack } from "@/hooks/useLibraryTrack";
import { useTrackRatingMutation } from "@/hooks/useTrackRatingMutation";
import {
  trackRatingModeEntered,
  trackRatingModeExited,
  trackTrackRated,
} from "@/lib/posthog";

export const Route = createFileRoute("/rating")({ component: RatingPage });

function RatingPage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isOnRatingPage = routerState.location.pathname === "/rating";
  const {
    currentTrack,
    currentTrackIndex,
    isPlaying,
    isReady,
    nextTrack,
    pause,
    playTrackList,
    previousTrack,
    resume,
  } = useSpotifyPlayer();
  const [ratedCount, setRatedCount] = useState(0);
  const hasStartedPlaybackRef = useRef(false);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const hasTrackedEntryRef = useRef(false);

  const updateRatingMutation = useTrackRatingMutation();

  const { data: unratedData } = useLibraryControllerGetTracks({
    page: 1,
    pageSize: 1,
    unratedOnly: true,
  });

  const totalUnratedCount = unratedData?.total || 0;

  const originalSpotifyId =
    currentTrack?.linked_from?.id || currentTrack?.id || "";

  const { libraryTrack, refetchLibraryTrack } = useLibraryTrack({
    spotifyId: originalSpotifyId,
  });

  const handleClose = useCallback(() => {
    const timeSpent = Math.round(
      (Date.now() - sessionStartTimeRef.current) / 1000,
    );
    trackRatingModeExited(ratedCount, timeSpent);
    navigate({ to: "/" });
  }, [navigate, ratedCount]);

  const handleSkip = useCallback(async () => {
    await nextTrack();
  }, [nextTrack]);

  const handlePrevious = useCallback(async () => {
    await previousTrack();
  }, [previousTrack]);

  const handleKeyboardRating = useCallback(
    (rating: number) => {
      if (updateRatingMutation.isPending) return;
      trackTrackRated(rating, "rating_mode");
      setRatedCount((prev) => prev + 1);
      setTimeout(() => handleSkip(), 500);
    },
    [handleSkip, updateRatingMutation.isPending],
  );

  const handleMouseRating = useCallback(() => {
    setRatedCount((prev) => prev + 1);
    setTimeout(() => handleSkip(), 500);
  }, [handleSkip]);

  const handleLibraryTrackUpdate = async () => {
    await refetchLibraryTrack();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const digitMatch = e.code.match(/^Digit([1-5])$/);
      if (digitMatch && libraryTrack) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;

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
            onSuccess: () => handleKeyboardRating(rating),
          },
        );
      }

      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        if (isPlaying) pause();
        else resume();
      }

      if (e.key === "n" || e.key === "ArrowRight") handleSkip();
      if (e.key === "p" || e.key === "ArrowLeft") handlePrevious();
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    libraryTrack,
    isPlaying,
    pause,
    resume,
    updateRatingMutation,
    handleKeyboardRating,
    handlePrevious,
    handleSkip,
    handleClose,
  ]);

  // Track rating mode entry
  useEffect(() => {
    if (totalUnratedCount > 0 && !hasTrackedEntryRef.current) {
      trackRatingModeEntered(totalUnratedCount);
      hasTrackedEntryRef.current = true;
    }
  }, [totalUnratedCount]);

  // Start playing shuffled unrated tracks
  useEffect(() => {
    if (!isReady || !isOnRatingPage || hasStartedPlaybackRef.current) return;

    playTrackList(["placeholder"], {
      contextType: "library",
      shuffle: true,
      unratedOnly: true,
    });
    hasStartedPlaybackRef.current = true;
  }, [isReady, isOnRatingPage, playTrackList]);

  if (totalUnratedCount === 0) {
    return <RatingEmptyState onClose={handleClose} />;
  }

  const remainingCount = totalUnratedCount;
  const sessionTotal = ratedCount + totalUnratedCount;
  const progressNum = sessionTotal > 0 ? (ratedCount / sessionTotal) * 100 : 0;
  const progress = progressNum.toFixed(0);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col py-4 overflow-y-auto">
      <RatingHeader
        onClose={handleClose}
        progress={progress}
        ratedCount={ratedCount}
        remainingCount={remainingCount}
      />

      <div className="flex-1 flex flex-col items-center px-4 md:px-8 pb-4 gap-2 min-h-0">
        <Text className="text-dark-3 text-center text-xs md:text-sm hidden md:block">
          <strong>Shortcuts:</strong> 1-5 = Full Stars · Shift+1-5 = Half Stars
          · Space = Play/Pause · N = Skip · P = Previous · Esc = Back
        </Text>

        {libraryTrack ? (
          <RatingTrackView
            currentTrackIndex={currentTrackIndex}
            libraryTrack={libraryTrack}
            onLibraryTrackUpdate={handleLibraryTrackUpdate}
            onMouseRating={handleMouseRating}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            updateRatingMutation={updateRatingMutation}
          />
        ) : (
          <Loader color="orange" size="xl" />
        )}
      </div>
    </div>
  );
}
