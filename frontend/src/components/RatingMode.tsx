/* eslint-disable max-lines */
import {
  ActionIcon,
  Badge,
  Box,
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
            <Stack align="center" gap="xl">
              <Title className="text-5xl text-dark-0" order={1}>
                🎉
              </Title>
              <Title className="text-3xl text-dark-1" order={2}>
                No Unrated Tracks!
              </Title>
              <Text className="text-dark-2 text-xl" size="lg">
                All your tracks have been rated. Great job!
              </Text>
              <Button color="orange" onClick={onClose} size="xl">
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
        <Modal.Body className="p-0 h-screen flex flex-col py-[2vh]">
          {/* Header with Close and Progress */}
          <Group className="px-8 mb-[2vh]" justify="space-between">
            <ActionIcon
              color="gray"
              onClick={onClose}
              size="xl"
              variant="subtle"
            >
              <X size={32} />
            </ActionIcon>

            <Group gap="md">
              <Badge color="green" radius="md" size="xl" variant="light">
                {ratedCount} Rated
              </Badge>
              <Badge color="orange" radius="md" size="xl" variant="light">
                {remainingCount} Remaining
              </Badge>
              <Badge color="blue" radius="md" size="xl" variant="light">
                {progress}% Complete
              </Badge>
            </Group>

            {/* Placeholder for symmetry */}
            <div className="w-[72px]" />
          </Group>

          {/* Content */}
          <Stack
            align="center"
            className="flex-1 px-8 pb-[12vh] min-h-0"
            gap="lg"
            justify="center"
          >
            {/* Keyboard Shortcuts Help */}
            <Text
              className="text-dark-3 text-center text-sm mb-[1vh]"
              size="sm"
            >
              <strong>Shortcuts:</strong> 1-5 = Full Stars • Shift+1-5 = Half
              Stars • Space = Play/Pause • N = Skip • P = Previous • Esc = Close
            </Text>

            {libraryTrack ? (
              <>
                {/* Album Art - Takes remaining space */}
                <div className="flex-1 flex items-center justify-center w-full min-h-0">
                  <Image
                    alt={libraryTrack.album || "Album"}
                    className="max-w-full max-h-full w-auto h-auto border-4 border-dark-5 shadow-2xl rounded-lg object-contain"
                    src={libraryTrack.albumArt}
                  />
                </div>

                {/* Track Info */}
                <Stack align="center" className="mt-[2vh]" gap="xs">
                  <Title className="text-4xl font-bold" order={1}>
                    {libraryTrack.title}
                  </Title>
                  <Text className="text-dark-1 text-2xl" size="xl">
                    {libraryTrack.artist}
                  </Text>
                  {libraryTrack.album && (
                    <Text className="text-dark-2 text-lg" size="lg">
                      {libraryTrack.album}
                    </Text>
                  )}
                </Stack>

                {/* Rating Stars */}
                <Stack align="center" className="mt-[2vh]" gap="lg">
                  <Text
                    className="text-dark-1 font-bold uppercase tracking-wider text-xl"
                    size="lg"
                  >
                    Rate This Track
                  </Text>
                  <Box className="transform scale-[3.5]">
                    <RatingSelector
                      externalMutation={updateRatingMutation}
                      onRatingChange={handleMouseRating}
                      rating={libraryTrack.rating ?? null}
                      trackId={libraryTrack.id}
                    />
                  </Box>
                </Stack>

                {/* Tags */}
                <Stack align="center" className="mt-[1vh]" gap="md">
                  <Text
                    className="text-dark-1 font-semibold uppercase tracking-wide"
                    size="md"
                  >
                    Tags
                  </Text>
                  <Box className="scale-125">
                    <InlineTagEditor
                      onTagsChange={handleLibraryTrackUpdate}
                      trackId={libraryTrack.id}
                      trackTags={libraryTrack.tags}
                    />
                  </Box>
                </Stack>

                {/* Controls */}
                <Group className="mt-[2vh]" gap="xl" justify="center">
                  <Button
                    color="gray"
                    disabled={currentTrackIndex === 0}
                    onClick={handlePrevious}
                    size="xl"
                    variant="light"
                  >
                    Previous (P)
                  </Button>
                  <Button color="orange" onClick={handleSkip} size="xl">
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
