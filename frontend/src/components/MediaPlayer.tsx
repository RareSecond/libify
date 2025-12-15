import {
  ActionIcon,
  Box,
  Button,
  Card,
  Collapse,
  Group,
  Image,
  Slider,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  ListMusic,
  Monitor,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";

import {
  getLibraryControllerGetTracksQueryKey,
  usePlaybackControllerTransferPlayback,
} from "../data/api";
import { useCurrentPlayback } from "../hooks/useCurrentPlayback";
import { useLibraryTrack } from "../hooks/useLibraryTrack";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { formatTime } from "../utils/format";
import { ClickableArtistList } from "./ClickableArtistList";
import { InlineTagEditor } from "./InlineTagEditor";
import { RatingSelector } from "./RatingSelector";
import { TrackSources } from "./TrackSources";

export function MediaPlayer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentPlayback, refetch: refetchPlayback } = useCurrentPlayback();

  // Mutation for transferring playback
  const transferPlaybackMutation = usePlaybackControllerTransferPlayback({
    mutation: {
      onError: (error) => {
        notifications.show({
          color: "red",
          message: error.message || "Failed to transfer playback",
          title: "Transfer Failed",
        });
      },
      onSuccess: () => {
        notifications.show({
          color: "green",
          message: "Playback transferred successfully",
          title: "Success",
        });
        // Refetch playback state to update UI
        setTimeout(() => refetchPlayback(), 1000);
      },
    },
  });

  const {
    currentTrack,
    deviceId,
    duration,
    isPlaying,
    isReady,
    isShuffled,
    nextTrack,
    pause,
    position,
    previousTrack,
    resume,
    seek,
    setVolume,
    toggleShuffle,
    volume,
  } = useSpotifyPlayer();

  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [mobileExpanded, { toggle: toggleMobileExpanded }] =
    useDisclosure(false);

  // Handle Spotify track relinking: If linked_from exists, use the original track ID
  // See: https://developer.spotify.com/documentation/web-api/concepts/track-relinking
  const originalSpotifyId = currentTrack?.linked_from?.id || currentTrack?.id;

  // Fetch library track data using the original (pre-relink) Spotify ID
  const { libraryTrack, refetchLibraryTrack } = useLibraryTrack({
    spotifyId: originalSpotifyId,
  });

  // Invalidate tracks query when library track is updated (tags changed)
  const handleLibraryTrackUpdate = async () => {
    await refetchLibraryTrack();
    // Invalidate all tracks queries to refresh the table
    queryClient.invalidateQueries({
      queryKey: getLibraryControllerGetTracksQueryKey(),
    });
  };

  // Determine what to display:
  // Priority 1: Web player SDK events (instant, always prefer this)
  const hasWebPlayerTrack = isReady && deviceId && currentTrack;

  // Priority 2: Cross-device playback from polling (for phone/desktop)
  const hasCrossDevicePlayback =
    currentPlayback?.track && currentPlayback?.device;

  // Check if the polling data matches our web player device
  const isPollingOurDevice = currentPlayback?.device?.id === deviceId;

  // If neither web player nor cross-device playback, don't show anything
  if (!hasWebPlayerTrack && !hasCrossDevicePlayback) {
    return null;
  }

  // Use web player SDK data if available (priority), otherwise use cross-device polling data
  // Don't use cross-device data if it's actually our web player device (avoid conflicts)
  const shouldUseCrossDeviceData =
    hasCrossDevicePlayback && !hasWebPlayerTrack && !isPollingOurDevice;

  const displayTrack = hasWebPlayerTrack ? currentTrack : null;
  const displayIsPlaying = hasWebPlayerTrack
    ? isPlaying
    : shouldUseCrossDeviceData
      ? (currentPlayback?.isPlaying ?? false)
      : false;
  const displayPosition = hasWebPlayerTrack
    ? position
    : shouldUseCrossDeviceData
      ? (currentPlayback?.progressMs ?? 0)
      : 0;
  const displayDuration = hasWebPlayerTrack
    ? duration
    : shouldUseCrossDeviceData
      ? (currentPlayback?.track?.durationMs ?? 0)
      : 0;
  const displayDeviceName = hasWebPlayerTrack
    ? import.meta.env.DEV
      ? "Codex.fm Web Player (Dev)"
      : "Codex.fm Web Player"
    : shouldUseCrossDeviceData
      ? (currentPlayback?.device?.name ?? "Unknown Device")
      : "Unknown Device";

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await resume();
    }
  };

  const handleSeek = (value: number) => {
    const newPosition = (value / 100) * duration;
    setDragPosition(newPosition);
    setIsDragging(true);
  };

  const handleSeekEnd = (value: number) => {
    const newPosition = (value / 100) * duration;
    seek(newPosition);
    setIsDragging(false);
  };

  const currentPosition = isDragging ? dragPosition : displayPosition;
  const progressPercent =
    displayDuration > 0 ? (currentPosition / displayDuration) * 100 : 0;

  // Track data to display (either from web player or cross-device)
  const trackToDisplay =
    displayTrack ||
    (shouldUseCrossDeviceData
      ? {
          album: {
            images:
              currentPlayback?.track?.album.images.map((url) => ({ url })) ??
              [],
            name: currentPlayback?.track?.album.name ?? "Unknown Album",
          },
          artists:
            currentPlayback?.track?.artists.map((a) => ({ name: a.name })) ??
            [],
          name: currentPlayback?.track?.name ?? "Unknown Track",
        }
      : {
          album: { images: [], name: "Unknown Album" },
          artists: [],
          name: "Unknown Track",
        });

  const handleTransferPlayback = () => {
    if (!deviceId) {
      notifications.show({
        color: "red",
        message: "Web player not ready. Please wait a moment and try again.",
        title: "Not Ready",
      });
      return;
    }

    transferPlaybackMutation.mutate({ data: { deviceId } });
  };

  return (
    <Card
      className="fixed bottom-0 left-0 right-0 rounded-none border-t border-dark-5 p-3 md:p-4 z-[250] bg-gradient-to-t from-dark-8 via-dark-7 to-dark-8 shadow-2xl"
      shadow="xl"
    >
      {/* Desktop Layout */}
      <Stack className="hidden md:flex" gap="sm">
        <Group align="center" justify="space-between">
          {/* Track Info */}
          <Group className="flex-1 min-w-0" gap="md">
            <Image
              alt={trackToDisplay.album.name}
              className="h-[60px] w-[60px] border border-dark-5"
              radius="sm"
              src={trackToDisplay.album.images[0]?.url}
            />
            <Stack className="flex-1 min-w-0" gap={4}>
              {/* Track name and sources */}
              <Group gap="xs" wrap="nowrap">
                <Text className="font-semibold text-dark-0" lineClamp={1}>
                  {trackToDisplay.name}
                </Text>
                {hasWebPlayerTrack && libraryTrack && (
                  <>
                    <Text className="text-dark-2" size="sm">
                      ·
                    </Text>
                    <Text
                      className="text-dark-1 font-medium shrink-0"
                      size="xs"
                    >
                      From:
                    </Text>
                    <TrackSources sources={libraryTrack.sources} />
                  </>
                )}
              </Group>

              {/* Artist name, rating, and tags */}
              <Group gap="xs" wrap="nowrap">
                <ClickableArtistList
                  artists={trackToDisplay.artists}
                  className="text-dark-1"
                  size="sm"
                />
                {hasWebPlayerTrack && libraryTrack && (
                  <>
                    <Text className="text-dark-2" size="sm">
                      ·
                    </Text>
                    <RatingSelector
                      rating={libraryTrack.rating ?? null}
                      trackId={libraryTrack.id}
                    />
                    <Text className="text-dark-2" size="sm">
                      ·
                    </Text>
                    <InlineTagEditor
                      onTagsChange={handleLibraryTrackUpdate}
                      trackId={libraryTrack.id}
                      trackTags={libraryTrack.tags}
                    />
                  </>
                )}
              </Group>
            </Stack>
          </Group>

          {/* Playback Controls */}
          <Stack align="center" className="flex-1 max-w-[500px]" gap="sm">
            {!hasWebPlayerTrack && hasCrossDevicePlayback && deviceId ? (
              <Button
                color="orange"
                disabled={!deviceId || transferPlaybackMutation.isPending}
                leftSection={<Monitor size={16} />}
                loading={transferPlaybackMutation.isPending}
                onClick={handleTransferPlayback}
                size="md"
                variant="light"
              >
                Transfer Playback Here
              </Button>
            ) : (
              <Group gap="xs">
                <ActionIcon
                  color={isShuffled ? "orange" : undefined}
                  disabled={!hasWebPlayerTrack}
                  onClick={toggleShuffle}
                  size="lg"
                  variant={isShuffled ? "filled" : "subtle"}
                >
                  <Shuffle size={20} />
                </ActionIcon>

                <ActionIcon
                  color="orange"
                  disabled={!hasWebPlayerTrack}
                  onClick={previousTrack}
                  size="lg"
                  variant="subtle"
                >
                  <SkipBack size={20} />
                </ActionIcon>

                <ActionIcon
                  className="bg-gradient-to-br from-orange-6 to-orange-8"
                  disabled={!hasWebPlayerTrack}
                  onClick={handlePlayPause}
                  size="xl"
                  variant="filled"
                >
                  {displayIsPlaying ? <Pause size={24} /> : <Play size={24} />}
                </ActionIcon>

                <ActionIcon
                  color="orange"
                  disabled={!hasWebPlayerTrack}
                  onClick={nextTrack}
                  size="lg"
                  variant="subtle"
                >
                  <SkipForward size={20} />
                </ActionIcon>
              </Group>
            )}

            {/* Progress Bar */}
            <Group className="w-full" gap="sm">
              <Text className="text-dark-1 min-w-10 text-right" size="xs">
                {formatTime(currentPosition)}
              </Text>
              <Slider
                className="flex-1"
                color="orange"
                disabled={!hasWebPlayerTrack}
                label={null}
                max={100}
                min={0}
                onChange={(value) => handleSeek(value)}
                onChangeEnd={handleSeekEnd}
                size="sm"
                step={0.1}
                thumbSize={12}
                value={progressPercent}
              />
              <Text className="text-dark-1 min-w-10" size="xs">
                {formatTime(displayDuration)}
              </Text>
            </Group>
          </Stack>

          {/* Volume Control & Device Info */}
          <Group className="flex-1" justify="flex-end">
            <Group align="center" gap="xs">
              {/* Fullscreen Mode Button */}
              <Tooltip label="Enter Fullscreen Mode">
                <ActionIcon
                  color="orange"
                  onClick={() => navigate({ to: "/fullscreen" })}
                  size="md"
                  variant="light"
                >
                  <ListMusic size={18} />
                </ActionIcon>
              </Tooltip>

              {/* Device indicator */}
              <Tooltip label={displayDeviceName}>
                <Group align="center" gap={4}>
                  <Monitor color="var(--color-orange-5)" size={16} />
                  <Text className="text-dark-1" size="xs">
                    {displayDeviceName}
                  </Text>
                </Group>
              </Tooltip>

              {hasWebPlayerTrack && (
                <>
                  <ActionIcon
                    color="orange"
                    onClick={() =>
                      setIsVolumeSliderVisible(!isVolumeSliderVisible)
                    }
                    size="md"
                    variant="subtle"
                  >
                    {volume === 0 ? (
                      <VolumeX size={18} />
                    ) : (
                      <Volume2 size={18} />
                    )}
                  </ActionIcon>

                  {isVolumeSliderVisible && (
                    <Box className="w-[100px]">
                      <Slider
                        color="orange"
                        label={null}
                        max={100}
                        min={0}
                        onChange={(value) => setVolume(value / 100)}
                        size="sm"
                        step={1}
                        thumbSize={10}
                        value={volume * 100}
                      />
                    </Box>
                  )}
                </>
              )}
            </Group>
          </Group>
        </Group>
      </Stack>

      {/* Mobile Layout */}
      <Stack className="flex md:hidden" gap="xs">
        {/* Collapsed Mini Player */}
        <Group
          align="center"
          gap="sm"
          justify="space-between"
          onClick={toggleMobileExpanded}
          wrap="nowrap"
        >
          <Group className="flex-1 min-w-0" gap="sm" wrap="nowrap">
            <Image
              alt={trackToDisplay.album.name}
              className="h-[48px] w-[48px] border border-dark-5"
              radius="sm"
              src={trackToDisplay.album.images[0]?.url}
            />
            <Stack className="flex-1 min-w-0" gap={2}>
              <Text
                className="font-semibold text-dark-0"
                lineClamp={1}
                size="sm"
              >
                {trackToDisplay.name}
              </Text>
              <ClickableArtistList
                artists={trackToDisplay.artists}
                className="text-dark-1"
                size="xs"
              />
            </Stack>
          </Group>

          <Group gap={4}>
            <ActionIcon
              className="bg-gradient-to-br from-orange-6 to-orange-8"
              disabled={!hasWebPlayerTrack}
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              size="lg"
              variant="filled"
            >
              {displayIsPlaying ? <Pause size={20} /> : <Play size={20} />}
            </ActionIcon>

            <ActionIcon
              onClick={(e) => {
                e.stopPropagation();
                toggleMobileExpanded();
              }}
              size="sm"
              variant="subtle"
            >
              {mobileExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              )}
            </ActionIcon>
          </Group>
        </Group>

        {/* Progress bar (always visible on mobile) */}
        <Slider
          className="w-full"
          color="orange"
          disabled={!hasWebPlayerTrack}
          label={null}
          max={100}
          min={0}
          onChange={(value) => handleSeek(value)}
          onChangeEnd={handleSeekEnd}
          size="xs"
          step={0.1}
          thumbSize={8}
          value={progressPercent}
        />

        {/* Expanded Controls */}
        <Collapse in={mobileExpanded}>
          <Stack className="pt-2" gap="md">
            {/* Time display */}
            <Group justify="space-between">
              <Text className="text-dark-1" size="xs">
                {formatTime(currentPosition)}
              </Text>
              <Text className="text-dark-1" size="xs">
                {formatTime(displayDuration)}
              </Text>
            </Group>

            {/* Playback controls */}
            {!hasWebPlayerTrack && hasCrossDevicePlayback && deviceId ? (
              <Button
                color="orange"
                disabled={!deviceId || transferPlaybackMutation.isPending}
                fullWidth
                leftSection={<Monitor size={16} />}
                loading={transferPlaybackMutation.isPending}
                onClick={handleTransferPlayback}
                size="md"
                variant="light"
              >
                Transfer Playback Here
              </Button>
            ) : (
              <Group gap="xs" justify="center">
                <ActionIcon
                  color={isShuffled ? "orange" : undefined}
                  disabled={!hasWebPlayerTrack}
                  onClick={toggleShuffle}
                  size="xl"
                  variant={isShuffled ? "filled" : "subtle"}
                >
                  <Shuffle size={24} />
                </ActionIcon>

                <ActionIcon
                  color="orange"
                  disabled={!hasWebPlayerTrack}
                  onClick={previousTrack}
                  size="xl"
                  variant="subtle"
                >
                  <SkipBack size={24} />
                </ActionIcon>

                <ActionIcon
                  className="bg-gradient-to-br from-orange-6 to-orange-8"
                  disabled={!hasWebPlayerTrack}
                  onClick={handlePlayPause}
                  size={56}
                  variant="filled"
                >
                  {displayIsPlaying ? <Pause size={28} /> : <Play size={28} />}
                </ActionIcon>

                <ActionIcon
                  color="orange"
                  disabled={!hasWebPlayerTrack}
                  onClick={nextTrack}
                  size="xl"
                  variant="subtle"
                >
                  <SkipForward size={24} />
                </ActionIcon>

                <ActionIcon
                  color="orange"
                  onClick={() => navigate({ to: "/fullscreen" })}
                  size="xl"
                  variant="light"
                >
                  <ListMusic size={24} />
                </ActionIcon>
              </Group>
            )}

            {/* Rating and tags (mobile) */}
            {hasWebPlayerTrack && libraryTrack && (
              <Stack gap="sm">
                <Group gap="xs" justify="center">
                  <Text className="text-dark-2" size="xs">
                    Rating:
                  </Text>
                  <RatingSelector
                    rating={libraryTrack.rating ?? null}
                    size="md"
                    trackId={libraryTrack.id}
                  />
                </Group>
                <Box>
                  <InlineTagEditor
                    onTagsChange={handleLibraryTrackUpdate}
                    trackId={libraryTrack.id}
                    trackTags={libraryTrack.tags}
                  />
                </Box>
              </Stack>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}
