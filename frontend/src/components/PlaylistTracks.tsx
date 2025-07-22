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
      <Center h={400}>
        <Text c="red">Error loading tracks: {error.message}</Text>
      </Center>
    );
  }

  if (playlistLoading || isLoading || !data) {
    return (
      <Center h={400}>
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
            leftSection={<ArrowLeft size={16} />}
            mb="xs"
            onClick={() => navigate({ to: "/playlists" })}
            size="xs"
            variant="subtle"
          >
            Back to Playlists
          </Button>
          <Text fw={700} mb="xs" size="lg">
            {playlist?.name}
          </Text>
          {playlist?.description && (
            <Text c="dimmed" size="sm">
              {playlist.description}
            </Text>
          )}
        </div>
      </Group>

      <Paper p="sm" radius="md" shadow="xs">
        <Text c="dimmed" mb="xs" size="sm">
          {tracks.length} tracks
        </Text>

        <TracksTable isLoading={false} onRefetch={refetch} tracks={tracks} />
      </Paper>
    </Stack>
  );
}
