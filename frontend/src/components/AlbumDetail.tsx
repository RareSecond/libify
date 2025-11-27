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
import { formatDurationDetailed } from "../utils/format";
import { TracksTable } from "./TracksTable";

interface AlbumDetailProps {
  album: string;
  artist: string;
}

export function AlbumDetail({ album, artist }: AlbumDetailProps) {
  const navigate = useNavigate();

  // Use the album-specific endpoint
  const { data, error, isLoading, refetch } =
    useLibraryControllerGetAlbumTracks(artist, album);

  if (error) {
    return (
      <Center className="h-[400px]">
        <Text className="text-red-600">
          Error loading album: {(error as Error).message}
        </Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center className="h-[400px]">
        <Loader size="lg" />
      </Center>
    );
  }

  // data contains an object with tracks property
  const tracks: TrackDto[] = data?.tracks || [];
  const albumArt = tracks[0]?.albumArt;
  // Use the actual database albumId from track data for playback context
  const albumId = tracks[0]?.albumId;
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

      <Paper className="p-6" radius="md" shadow="xs">
        <Group align="start" gap="xl" wrap="nowrap">
          <Box>
            {albumArt ? (
              <Image
                alt={album}
                className="h-[200px] w-[200px] object-cover"
                fallbackSrc="/placeholder-album.svg"
                radius="md"
                src={albumArt}
              />
            ) : (
              <Center className="h-[200px] w-[200px] rounded-lg bg-gray-200">
                <Music color="gray" size={48} />
              </Center>
            )}
          </Box>

          <Stack className="flex-1" gap="sm">
            <div>
              <Title order={2}>{album}</Title>
              <Text className="text-gray-600" size="lg">
                {artist}
              </Text>
            </div>

            <Group gap="xl">
              <Group gap="xs">
                <Text className="text-gray-600" size="sm">
                  Tracks:
                </Text>
                <Text className="font-medium">{tracks.length}</Text>
              </Group>

              <Group gap="xs">
                <Clock className="opacity-50" size={16} />
                <Text className="font-medium">
                  {formatDurationDetailed(totalDuration)}
                </Text>
              </Group>

              <Group gap="xs">
                <Play className="opacity-50" size={16} />
                <Text className="font-medium">{totalPlayCount} plays</Text>
              </Group>

              {avgRating && (
                <Group gap="xs">
                  <Star className="opacity-50" size={16} />
                  <Text className="font-medium">{avgRating.toFixed(1)}</Text>
                </Group>
              )}
            </Group>
          </Stack>
        </Group>
      </Paper>

      <Paper className="p-4" radius="md" shadow="xs">
        <Text className="mb-2 text-sm text-gray-600">Album Tracks</Text>

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
