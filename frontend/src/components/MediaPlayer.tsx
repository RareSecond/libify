import {
  ActionIcon,
  Box,
  Card,
  Divider,
  Group,
  Image,
  Slider,
  Stack,
  Text,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import {
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
import { getLibraryControllerGetTracksQueryKey } from "../data/api";
import { useLibraryTrack } from "../hooks/useLibraryTrack";
import { formatTime } from "../utils/format";
import { InlineTagEditor } from "./InlineTagEditor";
import { RatingSelector } from "./RatingSelector";
import { TrackSources } from "./TrackSources";

export function MediaPlayer() {
  const queryClient = useQueryClient();

  const {
    currentTrack,
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

  if (!isReady || !currentTrack) {
    return null;
  }

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

  const currentPosition = isDragging ? dragPosition : position;
  const progressPercent = duration > 0 ? (currentPosition / duration) * 100 : 0;

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
              alt={currentTrack.album.name}
              className="h-[60px] w-[60px]"
              radius="sm"
              src={currentTrack.album.images[0]?.url}
            />
            <Box className="flex-1 min-w-0">
              <Text className="font-semibold" lineClamp={1}>
                {currentTrack.name}
              </Text>
              <Text className="text-gray-600" lineClamp={1} size="sm">
                {currentTrack.artists.map((artist) => artist.name).join(", ")}
              </Text>
            </Box>
          </Group>

          {/* Playback Controls */}
          <Stack align="center" className="flex-1 max-w-[500px]" gap="sm">
            <Group gap="xs">
              <ActionIcon
                color={isShuffled ? "blue" : undefined}
                disabled={!isReady}
                onClick={toggleShuffle}
                size="lg"
                variant={isShuffled ? "filled" : "subtle"}
              >
                <Shuffle size={20} />
              </ActionIcon>

              <ActionIcon
                disabled={!isReady}
                onClick={previousTrack}
                size="lg"
                variant="subtle"
              >
                <SkipBack size={20} />
              </ActionIcon>

              <ActionIcon
                disabled={!isReady}
                onClick={handlePlayPause}
                size="xl"
                variant="filled"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </ActionIcon>

              <ActionIcon
                disabled={!isReady}
                onClick={nextTrack}
                size="lg"
                variant="subtle"
              >
                <SkipForward size={20} />
              </ActionIcon>
            </Group>

            {/* Progress Bar */}
            <Group className="w-full" gap="sm">
              <Text className="min-w-10 text-right text-gray-600" size="xs">
                {formatTime(currentPosition)}
              </Text>
              <Slider
                className="flex-1"
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
                {formatTime(duration)}
              </Text>
            </Group>
          </Stack>

          {/* Volume Control */}
          <Group className="flex-1" justify="flex-end">
            <Group align="center" gap="xs">
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
            </Group>
          </Group>
        </Group>

        {/* Track Metadata Section (Sources, Rating, Tags) */}
        {libraryTrack && (
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
