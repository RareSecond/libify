/* eslint-disable max-lines */
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useSpotifyPlayer } from "../contexts/SpotifyPlayerContext";
import { useLibraryControllerGetTracks } from "../data/api";
import { useLibraryTrack } from "../hooks/useLibraryTrack";
import { useTrackRatingMutation } from "../hooks/useTrackRatingMutation";
import { InlineTagEditor } from "./InlineTagEditor";
import { RatingSelector } from "./RatingSelector";

interface RatingModeProps {
  onClose: () => void;
  opened: boolean;
}

export function RatingMode({ onClose, opened }: RatingModeProps) {
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

  // Mutation for rating tracks with optimistic updates
  const updateRatingMutation = useTrackRatingMutation();

  // Fetch unrated track count for display only
  const { data: unratedData } = useLibraryControllerGetTracks(
    { page: 1, pageSize: 1, unratedOnly: true },
    { query: { enabled: opened } },
  );

  const totalUnratedCount = unratedData?.total || 0;

  // Handle Spotify track relinking
  const originalSpotifyId =
    currentTrack?.linked_from?.id || currentTrack?.id || "";

  // Fetch library track data
  const { libraryTrack, refetchLibraryTrack } = useLibraryTrack({
    spotifyId: originalSpotifyId,
  });

  // Handler functions
  const handleSkip = useCallback(async () => {
    await nextTrack();
  }, [nextTrack]);

  const handlePrevious = useCallback(async () => {
    await previousTrack();
  }, [previousTrack]);

  const handleKeyboardRating = useCallback(() => {
    // Guard against concurrent mutations
    if (updateRatingMutation.isPending) return;

    setRatedCount((prev) => prev + 1);

    // Wait to show star update feedback before advancing
    setTimeout(() => {
      handleSkip();
    }, 500);
  }, [handleSkip, updateRatingMutation.isPending]);

  const handleMouseRating = useCallback(() => {
    setRatedCount((prev) => prev + 1);

    // Wait to show star update feedback before advancing
    setTimeout(() => {
      handleSkip();
    }, 500);
  }, [handleSkip]);

  const handleLibraryTrackUpdate = async () => {
    await refetchLibraryTrack();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!opened) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Rating shortcuts: 1-5 (full stars) or Shift+1-5 (half stars)
      // Use e.code to detect physical key, since e.key changes with Shift (1 becomes !, etc)
      const digitMatch = e.code.match(/^Digit([1-5])$/);
      if (digitMatch && libraryTrack) {
        // Only allow Shift as a modifier - reject if Ctrl, Alt, or Meta are pressed
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const baseRating = parseInt(digitMatch[1]);
        // If shift is pressed, subtract 0.5 for half star
        const rating = e.shiftKey ? baseRating - 0.5 : baseRating;
        // Update rating via mutation
        updateRatingMutation.mutate(
          { data: { rating }, trackId: libraryTrack.id },
          {
            onError: (error) => {
              // Log error for diagnostics
              // eslint-disable-next-line no-console
              console.error("Failed to update track rating:", error);

              // Show user-visible error notification
              notifications.show({
                color: "red",
                message:
                  "Failed to save rating. Please try again or skip to the next track.",
                title: "Rating Error",
              });

              // Do NOT advance to next track on error - user can retry or manually skip
            },
            onSuccess: () => {
              handleKeyboardRating();
            },
          },
        );
      }

      // Space: Play/Pause
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        if (isPlaying) {
          pause();
        } else {
          resume();
        }
      }

      // N or ArrowRight: Skip to next
      if (e.key === "n" || e.key === "ArrowRight") {
        handleSkip();
      }

      // P or ArrowLeft: Previous
      if (e.key === "p" || e.key === "ArrowLeft") {
        handlePrevious();
      }

      // Escape: Close
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    opened,
    libraryTrack,
    isPlaying,
    pause,
    resume,
    onClose,
    updateRatingMutation,
    handleKeyboardRating,
    handlePrevious,
    handleSkip,
  ]);

  // Start playing shuffled unrated tracks via backend
  useEffect(() => {
    if (!opened || !isReady || hasStartedPlaybackRef.current) return;

    // Backend will build shuffled queue of unrated tracks
    playTrackList(["placeholder"], {
      contextType: "library",
      shuffle: true,
      unratedOnly: true,
    });
    hasStartedPlaybackRef.current = true;
  }, [opened, isReady, playTrackList]);

  // Reset when modal closes
  useEffect(() => {
    if (!opened) {
      hasStartedPlaybackRef.current = false;
      setRatedCount(0);
    }
  }, [opened]);

  if (totalUnratedCount === 0) {
    return (
      <Modal.Root fullScreen onClose={onClose} opened={opened} zIndex={200}>
        <Modal.Overlay backgroundOpacity={0.95} blur={12} />
        <Modal.Content className="bg-dark-9">
          <Modal.Body className="p-0 h-screen flex items-center justify-center">
            <Stack align="center" gap="lg md:gap-xl">
              <Title className="text-4xl md:text-5xl text-dark-0" order={1}>
                🎉
              </Title>
              <Title className="text-2xl md:text-3xl text-dark-1" order={2}>
                No Unrated Tracks!
              </Title>
              <Text className="text-dark-2 text-lg md:text-xl">
                All your tracks have been rated. Great job!
              </Text>
              <Button
                className="text-base md:text-lg px-6 md:px-8 py-3 md:py-4"
                color="orange"
                onClick={onClose}
              >
                Close
              </Button>
            </Stack>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    );
  }

  const remainingCount = totalUnratedCount;
  const sessionTotal = ratedCount + totalUnratedCount;
  const progressNum = sessionTotal > 0 ? (ratedCount / sessionTotal) * 100 : 0;
  const progress = progressNum.toFixed(0);

  return (
    <Modal.Root
      fullScreen
      onClose={onClose}
      opened={opened}
      transitionProps={{ duration: 200 }}
      zIndex={200}
    >
      <Modal.Overlay backgroundOpacity={0.95} blur={12} />
      <Modal.Content className="bg-dark-9">
        <Modal.Body className="p-0 h-screen flex flex-col pt-2 md:py-[2vh]">
          {/* Header with Close and Progress */}
          <Group
            className="px-3 md:px-8 mb-3 md:mb-[2vh]"
            justify="space-between"
          >
            <ActionIcon
              className="w-10 h-10 md:w-12 md:h-12"
              color="gray"
              onClick={onClose}
              variant="subtle"
            >
              <X className="w-6 h-6 md:w-8 md:h-8" />
            </ActionIcon>

            <Group className="gap-1 md:gap-md">
              <Badge
                className="text-xs md:text-sm px-2 md:px-3 py-1"
                color="green"
                radius="md"
                variant="light"
              >
                <span className="hidden sm:inline">{ratedCount} Rated</span>
                <span className="sm:hidden">{ratedCount}</span>
              </Badge>
              <Badge
                className="text-xs md:text-sm px-2 md:px-3 py-1"
                color="orange"
                radius="md"
                variant="light"
              >
                <span className="hidden sm:inline">
                  {remainingCount} Remaining
                </span>
                <span className="sm:hidden">{remainingCount}</span>
              </Badge>
              <Badge
                className="text-xs md:text-sm px-2 md:px-3 py-1 hidden xs:block"
                color="blue"
                radius="md"
                variant="light"
              >
                {progress}%
              </Badge>
            </Group>

            {/* Placeholder for symmetry - hidden on mobile */}
            <div className="w-10 md:w-[72px]" />
          </Group>

          {/* Content */}
          <Stack
            align="center"
            className="flex-1 px-3 md:px-8 min-h-0"
            gap="md md:gap-lg"
            justify="center"
          >
            {/* Keyboard Shortcuts Help - Hidden on small mobile */}
            <Text className="text-dark-3 text-center text-xs md:text-sm mb-1 md:mb-[1vh] hidden sm:block">
              <strong>Shortcuts:</strong>{" "}
              <span className="hidden md:inline">
                1-5 = Full Stars • Shift+1-5 = Half Stars • Space = Play/Pause •
                N = Skip • P = Previous • Esc = Close
              </span>
              <span className="md:hidden">
                1-5 = Stars • N = Skip • P = Prev
              </span>
            </Text>

            {libraryTrack ? (
              <>
                {/* Album Art - Takes remaining space */}
                <div className="flex-1 flex items-center justify-center w-full min-h-0 max-w-[85vw] md:max-w-full">
                  <Image
                    alt={libraryTrack.album || "Album"}
                    className="w-full h-auto max-h-full border-2 md:border-4 border-dark-5 shadow-2xl rounded-md md:rounded-lg object-contain"
                    src={libraryTrack.albumArt}
                  />
                </div>

                {/* Track Info */}
                <Stack
                  align="center"
                  className="mt-2 md:mt-[2vh] px-2"
                  gap="xs"
                >
                  <Title
                    className="text-xl sm:text-2xl md:text-4xl font-bold text-center"
                    order={1}
                  >
                    {libraryTrack.title}
                  </Title>
                  <Text className="text-dark-1 text-base sm:text-lg md:text-2xl text-center">
                    {libraryTrack.artist}
                  </Text>
                  {libraryTrack.album && (
                    <Text className="text-dark-2 text-sm sm:text-base md:text-lg text-center">
                      {libraryTrack.album}
                    </Text>
                  )}
                </Stack>

                {/* Rating Stars */}
                <Stack
                  align="center"
                  className="mt-3 md:mt-[2vh]"
                  gap="md md:gap-lg"
                >
                  <Text className="text-dark-1 font-bold uppercase tracking-wider text-sm md:text-xl">
                    Rate This Track
                  </Text>
                  <RatingSelector
                    externalMutation={updateRatingMutation}
                    onRatingChange={handleMouseRating}
                    rating={libraryTrack.rating ?? null}
                    size="xl"
                    trackId={libraryTrack.id}
                  />
                </Stack>

                {/* Tags */}
                <Stack
                  align="center"
                  className="mt-2 md:mt-[1vh]"
                  gap="xs md:gap-md"
                >
                  <Text className="text-dark-1 font-semibold uppercase tracking-wide text-xs md:text-base">
                    Tags
                  </Text>
                  <InlineTagEditor
                    onTagsChange={handleLibraryTrackUpdate}
                    trackId={libraryTrack.id}
                    trackTags={libraryTrack.tags}
                  />
                </Stack>

                {/* Controls */}
                <Group
                  className="mt-3 md:mt-[2vh] mb-32 md:mb-0 gap-2 md:gap-xl"
                  justify="center"
                >
                  <Button
                    className="text-sm md:text-base px-4 md:px-6"
                    color="gray"
                    disabled={currentTrackIndex === 0}
                    onClick={handlePrevious}
                    variant="light"
                  >
                    <span className="hidden sm:inline">Previous (P)</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <Button
                    className="text-sm md:text-base px-4 md:px-6"
                    color="orange"
                    onClick={handleSkip}
                  >
                    Skip (N)
                  </Button>
                </Group>
              </>
            ) : (
              // Loading state - centered loader with matching layout
              <div className="flex-1 flex items-center justify-center w-full min-h-0">
                <Loader color="orange" size="xl" />
              </div>
            )}
          </Stack>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
