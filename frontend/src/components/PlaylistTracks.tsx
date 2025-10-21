import {
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import {
  PaginatedTracksDto,
  usePlaylistsControllerFindOne,
  usePlaylistsControllerGetTracks,
} from "../data/api";
import { TracksTable } from "./TracksTable";

interface PlaylistTracksProps {
  playlistId: string;
}

export function PlaylistTracks({ playlistId }: PlaylistTracksProps) {
  const navigate = useNavigate();
  const { data: playlist, isLoading: playlistLoading } =
    usePlaylistsControllerFindOne(playlistId);
  const { data, error, isLoading, refetch } =
    usePlaylistsControllerGetTracks(playlistId);

  if (error) {
    return (
      <Center className="h-[400px]">
        <Text className="text-red-600">
          Error loading tracks: {error.message}
        </Text>
      </Center>
    );
  }

  if (playlistLoading || isLoading || !data) {
    return (
      <Center className="h-[400px]">
        <Loader size="lg" />
      </Center>
    );
  }

  const tracks = (data as PaginatedTracksDto).tracks || [];

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <div>
          <Button
            className="mb-2"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate({ to: "/playlists" })}
            size="xs"
            variant="subtle"
          >
            Back to Playlists
          </Button>
          <Text className="mb-2 font-bold" size="lg">
            {playlist?.name}
          </Text>
          {playlist?.description && (
            <Text className="text-gray-600" size="sm">
              {playlist.description}
            </Text>
          )}
        </div>
      </Group>

      <Paper className="p-4" radius="md" shadow="xs">
        <Text className="mb-2 text-gray-600" size="sm">
          {tracks.length} tracks
        </Text>

        <TracksTable isLoading={false} onRefetch={refetch} tracks={tracks} />
      </Paper>
    </Stack>
  );
}
