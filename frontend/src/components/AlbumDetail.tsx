import {
  Button,
  Center,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Box,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Music, Play, Star, Clock } from 'lucide-react';

import { useLibraryControllerGetTracks, TrackDto } from '../data/api';
import { TracksTable } from './TracksTable';

interface AlbumDetailProps {
  artist: string;
  album: string;
}

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

export function AlbumDetail({ artist, album }: AlbumDetailProps) {
  const navigate = useNavigate();
  
  // For now, use the regular tracks API with search filter
  // This will be replaced when the album-specific endpoint is generated
  const { data, isLoading, error, refetch } = useLibraryControllerGetTracks({
    page: 1,
    pageSize: 100,
    search: album,
  });

  if (error) {
    return (
      <Center h={400}>
        <Text c="red">Error loading album: {(error as Error).message}</Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  // Filter tracks to only show ones from this specific album and artist
  const tracks = (data?.tracks || []).filter(
    (track: TrackDto) => track.album === album && track.artist === artist
  );
  const albumArt = tracks[0]?.albumArt;
  const totalDuration = tracks.reduce((sum: number, track: TrackDto) => sum + track.duration, 0);
  const totalPlayCount = tracks.reduce((sum: number, track: TrackDto) => sum + track.totalPlayCount, 0);
  const avgRating = tracks.filter((t: TrackDto) => t.rating).reduce((sum: number, track: TrackDto) => sum + (track.rating || 0), 0) / tracks.filter((t: TrackDto) => t.rating).length || null;

  return (
    <Stack gap="md">
      <Button
        leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate({ to: '/albums' })}
        size="xs"
        variant="subtle"
      >
        Back to Albums
      </Button>

      <Paper p="lg" radius="md" shadow="xs">
        <Group align="start" gap="xl" wrap="nowrap">
          <Box>
            {albumArt ? (
              <Image
                alt={album}
                fallbackSrc="/placeholder-album.svg"
                h={200}
                radius="md"
                src={albumArt}
                style={{ objectFit: 'cover' }}
                w={200}
              />
            ) : (
              <Center bg="gray.2" h={200} style={{ borderRadius: 8 }} w={200}>
                <Music color="gray" size={48} />
              </Center>
            )}
          </Box>

          <Stack gap="sm" style={{ flex: 1 }}>
            <div>
              <Title order={2}>{album}</Title>
              <Text c="dimmed" size="lg">{artist}</Text>
            </div>

            <Group gap="xl">
              <Group gap="xs">
                <Text c="dimmed" size="sm">Tracks:</Text>
                <Text fw={500}>{tracks.length}</Text>
              </Group>

              <Group gap="xs">
                <Clock size={16} style={{ opacity: 0.5 }} />
                <Text fw={500}>{formatDuration(totalDuration)}</Text>
              </Group>

              <Group gap="xs">
                <Play size={16} style={{ opacity: 0.5 }} />
                <Text fw={500}>{totalPlayCount} plays</Text>
              </Group>

              {avgRating && (
                <Group gap="xs">
                  <Star size={16} style={{ opacity: 0.5 }} />
                  <Text fw={500}>{avgRating.toFixed(1)}</Text>
                </Group>
              )}
            </Group>
          </Stack>
        </Group>
      </Paper>

      <Paper p="sm" radius="md" shadow="xs">
        <Text c="dimmed" mb="xs" size="sm">
          Album Tracks
        </Text>
        
        <TracksTable 
          isLoading={false}
          onRefetch={refetch}
          tracks={tracks}
        />
      </Paper>
    </Stack>
  );
}