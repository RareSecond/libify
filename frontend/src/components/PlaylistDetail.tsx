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
import { useState } from "react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

import {
  LibraryControllerGetPlaylistTracksSortBy,
  TrackDto,
  useLibraryControllerGetPlaylistTracks,
} from "../data/api";
import { Route } from "../routes/~playlists.$id";
import { formatDurationDetailed } from "../utils/format";
import { TracksTableWithControls } from "./TracksTableWithControls";

interface PlaylistDetailProps {
  playlistId: string;
}

export function PlaylistDetail({ playlistId }: PlaylistDetailProps) {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page = 1, pageSize = 20 } = Route.useSearch();
  const { playTrackList } = useSpotifyPlayer();
  const [sortBy, setSortBy] = useState<
    LibraryControllerGetPlaylistTracksSortBy | undefined
  >();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, error, isLoading, refetch } =
    useLibraryControllerGetPlaylistTracks(playlistId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

  const tracks: TrackDto[] = data?.tracks || [];

  const handlePlayFromBeginning = async () => {
    if (!data?.tracks?.length || !data.spotifyId) return;
    const uris = data.tracks.map((t) => `spotify:track:${t.spotifyId}`);
    await playTrackList(uris, {
      contextId: data.spotifyId,
      contextType: "playlist",
      shuffle: false,
    });
  };

  const handlePlayShuffled = async () => {
    if (!data?.tracks?.length || !data.spotifyId) return;
    const uris = data.tracks.map((t) => `spotify:track:${t.spotifyId}`);
    await playTrackList(uris, {
      contextId: data.spotifyId,
      contextType: "playlist",
      shuffle: true,
    });
  };

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    navigate({
      search: (prev) => ({ ...prev, page: 1, pageSize: newPageSize }),
    });
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
            disabled={!data?.total}
            leftSection={<Play size={16} />}
            onClick={handlePlayFromBeginning}
            size="sm"
            variant="filled"
          >
            Play
          </Button>
          <Button
            disabled={!data?.total}
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
                <Text className="font-medium">{data?.total || 0}</Text>
              </Group>

              <Group gap="xs">
                <Clock className="opacity-50" size={16} />
                <Text className="font-medium">
                  {formatDurationDetailed(
                    tracks.reduce((sum, t) => sum + t.duration, 0),
                  )}
                </Text>
              </Group>

              <Group gap="xs">
                <Play className="opacity-50" size={16} />
                <Text className="font-medium">
                  {tracks.reduce((sum, t) => sum + t.totalPlayCount, 0)} plays
                </Text>
              </Group>

              {tracks.some((t) => t.rating) && (
                <Group gap="xs">
                  <Star className="opacity-50" size={16} />
                  <Text className="font-medium">
                    {(
                      tracks
                        .filter((t) => t.rating)
                        .reduce((sum, t) => sum + (t.rating || 0), 0) /
                      tracks.filter((t) => t.rating).length
                    ).toFixed(1)}
                  </Text>
                </Group>
              )}
            </Group>
          </Stack>
        </Group>
      </Paper>

      <TracksTableWithControls
        contextId={data?.spotifyId}
        contextType="playlist"
        data={{
          page: data?.page || 1,
          pageSize: data?.pageSize || 20,
          total: data?.total || 0,
          totalPages: data?.totalPages || 1,
          tracks,
        }}
        hideSearch
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRefetch={refetch}
        onSortChange={(columnId) => {
          if (columnId === sortBy) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          } else {
            setSortBy(columnId as LibraryControllerGetPlaylistTracksSortBy);
            setSortOrder("desc");
          }
        }}
        page={page}
        pageSize={pageSize}
        showSelection
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </Stack>
  );
}
