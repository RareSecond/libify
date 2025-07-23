import {
  Box,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, Music, Play, Star } from "lucide-react";

import { TrackDto, useLibraryControllerGetAlbumTracks } from "../data/api";
import { TracksTable } from "./TracksTable";

interface AlbumDetailProps {
  album: string;
  artist: string;
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

export function AlbumDetail({ album, artist }: AlbumDetailProps) {
  const navigate = useNavigate();

  // Use the album-specific endpoint
  const { data, error, isLoading, refetch } =
    useLibraryControllerGetAlbumTracks(artist, album);

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

  // data contains an object with tracks property
  const tracks: TrackDto[] = data?.tracks || [];
  const albumArt = tracks[0]?.albumArt;
  const albumId = `${artist}|${album}`;
  const totalDuration = tracks.reduce(
    (sum: number, track: TrackDto) => sum + track.duration,
    0,
  );
  const totalPlayCount = tracks.reduce(
    (sum: number, track: TrackDto) => sum + track.totalPlayCount,
    0,
  );
  const avgRating =
    tracks.length > 0 && tracks.filter((t: TrackDto) => t.rating).length > 0
      ? tracks
          .filter((t: TrackDto) => t.rating)
          .reduce(
            (sum: number, track: TrackDto) => sum + (track.rating || 0),
            0,
          ) / tracks.filter((t: TrackDto) => t.rating).length
      : null;

  return (
    <Stack gap="md">
      <Button
        leftSection={<ArrowLeft size={16} />}
        onClick={() => navigate({ to: "/albums" })}
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
                style={{ objectFit: "cover" }}
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
              <Text c="dimmed" size="lg">
                {artist}
              </Text>
            </div>

            <Group gap="xl">
              <Group gap="xs">
                <Text c="dimmed" size="sm">
                  Tracks:
                </Text>
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
          contextId={albumId}
          contextType="album"
          isLoading={false}
          onRefetch={refetch}
          tracks={tracks}
        />
      </Paper>
    </Stack>
  );
}
