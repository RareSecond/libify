import {
  ActionIcon,
  Box,
  Card,
  Group,
  Image,
  Slider,
  Stack,
  Text,
} from '@mantine/core';
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';

import { useSpotifyPlayer } from '../contexts/SpotifyPlayerContext';

const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function MediaPlayer() {
  const {
    currentTrack,
    duration,
    isPlaying,
    isReady,
    nextTrack,
    pause,
    position,
    previousTrack,
    resume,
    seek,
    setVolume,
    volume,
  } = useSpotifyPlayer();

  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);

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
      p="md"
      shadow="lg"
      style={{
        borderRadius: 0,
        borderTop: '1px solid #e9ecef',
        bottom: 0,
        left: 0,
        position: 'fixed',
        right: 0,
        zIndex: 1000,
      }}
    >
      <Group align="center" justify="space-between">
        {/* Track Info */}
        <Group gap="md" style={{ flex: 1, minWidth: 0 }}>
          <Image
            alt={currentTrack.album.name}
            h={60}
            radius="sm"
            src={currentTrack.album.images[0]?.url}
            w={60}
          />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} lineClamp={1}>
              {currentTrack.name}
            </Text>
            <Text c="dimmed" lineClamp={1} size="sm">
              {currentTrack.artists.map(artist => artist.name).join(', ')}
            </Text>
          </Box>
        </Group>

        {/* Playback Controls */}
        <Stack align="center" gap="sm" style={{ flex: 1, maxWidth: 500 }}>
          <Group gap="xs">
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
          <Group gap="sm" style={{ width: '100%' }}>
            <Text c="dimmed" size="xs" style={{ minWidth: 40, textAlign: 'right' }}>
              {formatTime(currentPosition)}
            </Text>
            <Slider
              max={100}
              min={0}
              onChange={(value) => handleSeek(value)}
              onChangeEnd={handleSeekEnd}
              size="sm"
              step={0.1}
              style={{ flex: 1 }}
              thumbSize={12}
              value={progressPercent}
              label={null}
            />
            <Text c="dimmed" size="xs" style={{ minWidth: 40 }}>
              {formatTime(duration)}
            </Text>
          </Group>
        </Stack>

        {/* Volume Control */}
        <Group justify="flex-end" style={{ flex: 1 }}>
          <Group align="center" gap="xs">
            <ActionIcon
              onClick={() => setIsVolumeSliderVisible(!isVolumeSliderVisible)}
              size="md"
              variant="subtle"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </ActionIcon>
            
            {isVolumeSliderVisible && (
              <Box style={{ width: 100 }}>
                <Slider
                  max={100}
                  min={0}
                  onChange={(value) => setVolume(value / 100)}
                  size="sm"
                  step={1}
                  thumbSize={10}
                  value={volume * 100}
                  label={null}
                />
              </Box>
            )}
          </Group>
        </Group>
      </Group>
    </Card>
  );
}