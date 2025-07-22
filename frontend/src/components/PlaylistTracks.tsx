import {
  Box,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Paper,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-router";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowLeft, Music } from "lucide-react";
import { useMemo, useState } from "react";

import {
  TrackDto,
  useLibraryControllerPlayTrack,
  usePlaylistsControllerFindOne,
  usePlaylistsControllerGetTracks,
} from "../data/api";
import { useColumnOrder } from "../hooks/useColumnOrder";
import { InlineTagEditor } from "./InlineTagEditor";
import { RatingSelector } from "./RatingSelector";

interface PlaylistTracksProps {
  playlistId: string;
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatDate = (date: null | string | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

export function PlaylistTracks({ playlistId }: PlaylistTracksProps) {
  const navigate = useNavigate();
  const { data: playlist, isLoading: playlistLoading } = usePlaylistsControllerFindOne(playlistId);
  const { data, error, isLoading, refetch } = usePlaylistsControllerGetTracks(playlistId);
  const playTrackMutation = useLibraryControllerPlayTrack();
  const [draggedColumn, setDraggedColumn] = useState<null | string>(null);

  const handlePlayTrack = async (trackId: string, trackTitle: string) => {
    try {
      await playTrackMutation.mutateAsync({ trackId });
      notifications.show({
        color: "green",
        message: trackTitle,
        title: "Now playing",
      });
    } catch (error) {
      notifications.show({
        color: "red",
        message:
          (error as Error & { response?: { data?: { message?: string } } })
            .response?.data?.message ||
          "Please make sure Spotify is open on one of your devices",
        title: "Failed to play track",
      });
    }
  };

  if (error) {
    return (
      <Center h={400}>
        <Text c="red">Error loading tracks: {error.message}</Text>
      </Center>
    );
  }

  if (playlistLoading || isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  const tracks = (data as any)?.tracks || [];

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <div>
          <Button
            leftSection={<ArrowLeft size={16} />}
            mb="xs"
            onClick={() => navigate({ to: '/playlists' })}
            size="xs"
            variant="subtle"
          >
            Back to Playlists
          </Button>
          <Text fw={700} mb="xs" size="lg">
            {playlist?.name}
          </Text>
          {playlist?.description && (
            <Text c="dimmed" size="sm">{playlist.description}</Text>
          )}
        </div>
      </Group>

      <Paper p="sm" radius="md" shadow="xs">
        <Text c="dimmed" mb="xs" size="sm">
          {tracks.length} tracks
        </Text>

        <div className="overflow-x-auto">
          <Table
            highlightOnHover
            horizontalSpacing="xs"
            striped
            verticalSpacing={6}
            withTableBorder
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={50}></Table.Th>
                <Table.Th miw={200}>Title</Table.Th>
                <Table.Th miw={150}>Artist</Table.Th>
                <Table.Th miw={150}>Album</Table.Th>
                <Table.Th w={80}>Duration</Table.Th>
                <Table.Th w={60}>Plays</Table.Th>
                <Table.Th w={100}>Last Played</Table.Th>
                <Table.Th miw={120}>Rating</Table.Th>
                <Table.Th miw={150}>Tags</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tracks.map((track: TrackDto) => (
                <Table.Tr
                  className="hover:bg-gray-50"
                  key={track.id}
                  onClick={() => handlePlayTrack(track.id, track.title)}
                  style={{ cursor: "pointer" }}
                >
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {track.albumArt ? (
                        <Box
                          h={36}
                          style={{
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                          w={36}
                        >
                          <Image
                            alt={track.album || track.title}
                            fallbackSrc="/placeholder-album.svg"
                            fit="cover"
                            h={36}
                            src={track.albumArt}
                            style={{ objectFit: "cover" }}
                            w={36}
                          />
                        </Box>
                      ) : (
                        <Center
                          bg="gray.2"
                          h={36}
                          style={{ borderRadius: "4px" }}
                          w={36}
                        >
                          <Music color="gray" size={18} />
                        </Center>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500} lineClamp={1} size="sm">
                      {track.title}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text lineClamp={1} size="sm">
                      {track.artist}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text c="dimmed" lineClamp={1} size="sm">
                      {track.album || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text c="dimmed" size="sm">
                      {formatDuration(track.duration)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ta="center">
                      {track.totalPlayCount}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text c="dimmed" size="xs">
                      {formatDate(track.lastPlayedAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <RatingSelector
                      onRatingChange={refetch}
                      rating={track.rating ?? null}
                      trackId={track.id}
                    />
                  </Table.Td>
                  <Table.Td>
                    <InlineTagEditor
                      onTagsChange={refetch}
                      trackId={track.id}
                      trackTags={track.tags}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </Paper>
    </Stack>
  );
}