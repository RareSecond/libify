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
import { ArrowLeft, Clock, ListMusic, Play, Shuffle, Star } from "lucide-react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

import { TrackDto, useLibraryControllerGetPlaylistTracks } from "../data/api";
import { formatDurationDetailed } from "../utils/format";
import { TracksTableWithControls } from "./TracksTableWithControls";

interface PlaylistDetailProps {
  playlistId: string;
}

export function PlaylistDetail({ playlistId }: PlaylistDetailProps) {
  const navigate = useNavigate();
  const { playTrackList } = useSpotifyPlayer();

  const { data, error, isLoading, refetch } =
    useLibraryControllerGetPlaylistTracks(playlistId);

  const handlePlayFromBeginning = async () => {
    if (!data?.tracks?.length) return;
    const uris = data.tracks.map((t) => `spotify:track:${t.spotifyId}`);
    await playTrackList(uris, { shuffle: false });
  };

  const handlePlayShuffled = async () => {
    if (!data?.tracks?.length) return;
    const uris = data.tracks.map((t) => `spotify:track:${t.spotifyId}`);
    await playTrackList(uris, { shuffle: true });
  };

  if (error) {
    return (
      <Center className="h-[400px]">
        <Text className="text-red-600">
          Error loading playlist: {(error as Error).message}
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

  const tracks: TrackDto[] = data?.tracks || [];
  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
  const totalPlayCount = tracks.reduce(
    (sum, track) => sum + track.totalPlayCount,
    0,
  );
  const ratedTracks = tracks.filter((t) => t.rating);
  const avgRating =
    ratedTracks.length > 0
      ? ratedTracks.reduce((sum, t) => sum + (t.rating || 0), 0) /
        ratedTracks.length
      : null;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Button
          leftSection={<ArrowLeft size={16} />}
          onClick={() => navigate({ to: "/playlists" })}
          size="xs"
          variant="subtle"
        >
          Back to Playlists
        </Button>
        <Group gap="xs">
          <Button
            disabled={tracks.length === 0}
            leftSection={<Play size={16} />}
            onClick={handlePlayFromBeginning}
            size="sm"
            variant="filled"
          >
            Play
          </Button>
          <Button
            disabled={tracks.length === 0}
            leftSection={<Shuffle size={16} />}
            onClick={handlePlayShuffled}
            size="sm"
            variant="outline"
          >
            Shuffle
          </Button>
        </Group>
      </Group>

      <Paper className="p-6" radius="md" shadow="xs">
        <Group align="start" gap="xl" wrap="nowrap">
          <Box>
            {data?.imageUrl ? (
              <Image
                alt={data.name}
                className="h-[200px] w-[200px] object-cover"
                fallbackSrc="/placeholder-album.svg"
                radius="md"
                src={data.imageUrl}
              />
            ) : (
              <Center className="h-[200px] w-[200px] rounded-lg bg-gray-200">
                <ListMusic color="gray" size={48} />
              </Center>
            )}
          </Box>

          <Stack className="flex-1" gap="sm">
            <div>
              <Title order={2}>{data?.name}</Title>
              {data?.description && (
                <Text className="text-gray-600" size="md">
                  {data.description}
                </Text>
              )}
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

      <TracksTableWithControls
        data={{
          page: 1,
          pageSize: tracks.length,
          total: tracks.length,
          totalPages: 1,
          tracks,
        }}
        hidePageSize
        hideSearch
        onRefetch={refetch}
        showSelection
      />
    </Stack>
  );
}
