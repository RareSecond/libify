import {
  ActionIcon,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Image,
  Slider,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import {
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

import { useSpotifyPlayer } from "../contexts/SpotifyPlayerContext";
import {
  getLibraryControllerGetTracksQueryKey,
  usePlaybackControllerTransferPlayback,
} from "../data/api";
import { useCurrentPlayback } from "../hooks/useCurrentPlayback";
import { useLibraryTrack } from "../hooks/useLibraryTrack";
import { formatTime } from "../utils/format";
import { InlineTagEditor } from "./InlineTagEditor";
import { RatingSelector } from "./RatingSelector";
import { TrackSources } from "./TrackSources";

export function MediaPlayer() {
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
  // Check if the web player's device is actually the active one
  const isWebPlayerActive =
    deviceId &&
    currentPlayback?.device?.id === deviceId &&
    currentPlayback?.device?.isActive;

  // Use web player data only if this device is active, otherwise use cross-device data
  const hasWebPlayerTrack = isReady && currentTrack && isWebPlayerActive;
  const hasCrossDevicePlayback = currentPlayback?.track && currentPlayback?.device;

  // If neither web player nor cross-device playback, don't show anything
  if (!hasWebPlayerTrack && !hasCrossDevicePlayback) {
    return null;
  }

  // Use web player data if this device is active, otherwise use cross-device data
  const displayTrack = hasWebPlayerTrack ? currentTrack : null;
  const displayIsPlaying = hasWebPlayerTrack ? isPlaying : (currentPlayback?.isPlaying ?? false);
  const displayPosition = hasWebPlayerTrack ? position : (currentPlayback?.progressMs ?? 0);
  const displayDuration = hasWebPlayerTrack ? duration : (currentPlayback?.track?.durationMs ?? 0);
  const displayDeviceName = hasWebPlayerTrack
    ? (import.meta.env.DEV ? "Spotlib Web Player (Dev)" : "Spotlib Web Player")
    : (currentPlayback?.device?.name ?? "Unknown Device");

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
  const progressPercent = displayDuration > 0 ? (currentPosition / displayDuration) * 100 : 0;

  // Track data to display (either from web player or cross-device)
  const trackToDisplay = displayTrack || {
    album: {
      images: currentPlayback?.track?.album.images.map(url => ({ url })) ?? [],
      name: currentPlayback?.track?.album.name ?? "Unknown Album",
    },
    artists: currentPlayback?.track?.artists.map(a => ({ name: a.name })) ?? [],
    name: currentPlayback?.track?.name ?? "Unknown Track",
  };

  const handleTransferPlayback = () => {
    if (!deviceId) {
      notifications.show({
        color: "red",
        message: "Web player not ready. Please wait a moment and try again.",
        title: "Not Ready",
      });
      return;
    }

    transferPlaybackMutation.mutate({
      data: { deviceId },
    });
  };

  return (
    <Card
      className="fixed bottom-0 left-0 right-0 rounded-none border-t border-gray-200 p-4 z-[250]"
      shadow="lg"
    >
      <Stack gap="sm">
        <Group align="center" justify="space-between">
          {/* Track Info */}
          <Group className="flex-1 min-w-0" gap="md">
            <Image
              alt={trackToDisplay.album.name}
              className="h-[60px] w-[60px]"
              radius="sm"
              src={trackToDisplay.album.images[0]?.url}
            />
            <Box className="flex-1 min-w-0">
              <Text className="font-semibold" lineClamp={1}>
                {trackToDisplay.name}
              </Text>
              <Text className="text-gray-600" lineClamp={1} size="sm">
                {trackToDisplay.artists.map((artist) => artist.name).join(", ")}
              </Text>
            </Box>
          </Group>

          {/* Playback Controls */}
          <Stack align="center" className="flex-1 max-w-[500px]" gap="sm">
            {!hasWebPlayerTrack && hasCrossDevicePlayback && deviceId ? (
              <Button
                disabled={!deviceId || transferPlaybackMutation.isPending}
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
                  color={isShuffled ? "blue" : undefined}
                  disabled={!hasWebPlayerTrack}
                  onClick={toggleShuffle}
                  size="lg"
                  variant={isShuffled ? "filled" : "subtle"}
                >
                  <Shuffle size={20} />
                </ActionIcon>

                <ActionIcon
                  disabled={!hasWebPlayerTrack}
                  onClick={previousTrack}
                  size="lg"
                  variant="subtle"
                >
                  <SkipBack size={20} />
                </ActionIcon>

                <ActionIcon
                  disabled={!hasWebPlayerTrack}
                  onClick={handlePlayPause}
                  size="xl"
                  variant="filled"
                >
                  {displayIsPlaying ? <Pause size={24} /> : <Play size={24} />}
                </ActionIcon>

                <ActionIcon
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
              <Text className="min-w-10 text-right text-gray-600" size="xs">
                {formatTime(currentPosition)}
              </Text>
              <Slider
                className="flex-1"
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
              <Text className="min-w-10 text-gray-600" size="xs">
                {formatTime(displayDuration)}
              </Text>
            </Group>
          </Stack>

          {/* Volume Control & Device Info */}
          <Group className="flex-1" justify="flex-end">
            <Group align="center" gap="xs">
              {/* Device indicator */}
              <Tooltip label={displayDeviceName}>
                <Group align="center" gap={4}>
                  <Monitor className="text-gray-500" size={16} />
                  <Text className="text-gray-600" size="xs">
                    {displayDeviceName}
                  </Text>
                </Group>
              </Tooltip>

              {hasWebPlayerTrack && (
                <>
                  <ActionIcon
                    onClick={() => setIsVolumeSliderVisible(!isVolumeSliderVisible)}
                    size="md"
                    variant="subtle"
                  >
                    {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </ActionIcon>

                  {isVolumeSliderVisible && (
                    <Box className="w-[100px]">
                      <Slider
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

        {/* Track Metadata Section (Sources, Rating, Tags) - Only show for web player */}
        {hasWebPlayerTrack && libraryTrack && (
          <>
            <Divider />
            <Group align="center" gap="xl" justify="space-between">
              {/* Sources */}
              <Group gap="xs">
                <Text className="text-gray-600 font-medium" size="xs">
                  From:
                </Text>
                <TrackSources sources={libraryTrack.sources} />
              </Group>

              {/* Rating */}
              <Group gap="xs">
                <Text className="text-gray-600 font-medium" size="xs">
                  Rating:
                </Text>
                <RatingSelector
                  rating={libraryTrack.rating ?? null}
                  trackId={libraryTrack.id}
                />
              </Group>

              {/* Tags */}
              <Group className="flex-1" gap="xs">
                <Text className="text-gray-600 font-medium" size="xs">
                  Tags:
                </Text>
                <InlineTagEditor
                  onTagsChange={handleLibraryTrackUpdate}
                  trackId={libraryTrack.id}
                  trackTags={libraryTrack.tags}
                />
              </Group>
            </Group>
          </>
        )}
      </Stack>
    </Card>
  );
}
