import {
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { RefreshCw, Search } from "lucide-react";
import { useState } from "react";

import { useSpotifyPlayer } from "../contexts/SpotifyPlayerContext";
import {
  PlayHistoryItemDto,
  useLibraryControllerAddTrackToLibrary,
  useLibraryControllerGetPlayHistory,
} from "../data/api";
import { usePlayHistorySync } from "../hooks/usePlayHistorySync";
import { PlayHistoryTableRow } from "./PlayHistoryTableRow";

export function PlayHistoryTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [includeNonLibrary, setIncludeNonLibrary] = useState(true);
  const pageSize = 50;

  const { playTrackList } = useSpotifyPlayer();

  const { data, isLoading, refetch } = useLibraryControllerGetPlayHistory({
    includeNonLibrary,
    page,
    pageSize,
    search: debouncedSearch || undefined,
  });

  const { isSyncing, syncPlays } = usePlayHistorySync(refetch);

  const addToLibraryMutation = useLibraryControllerAddTrackToLibrary();

  const handleAddToLibrary = async (trackId: string, trackTitle: string) => {
    try {
      await addToLibraryMutation.mutateAsync({ trackId });
      notifications.show({
        color: "green",
        message: `Added "${trackTitle}" to your library`,
        title: "Success",
      });
      refetch();
    } catch {
      notifications.show({
        color: "red",
        message: "Failed to add track to library",
        title: "Error",
      });
    }
  };

  const handlePlayTrack = async (
    trackTitle: string,
    spotifyId: string,
    trackId: string,
  ) => {
    try {
      await playTrackList([
        { spotifyUri: `spotify:track:${spotifyId}`, trackId },
      ]);

      notifications.show({
        color: "orange",
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

  if (isLoading) {
    return (
      <Center className="h-[400px]">
        <Loader color="orange" size="lg" />
      </Center>
    );
  }

  const totalPages = data?.totalPages || 1;
  const items: PlayHistoryItemDto[] = data?.items || [];

  return (
    <Stack gap="md">
      <Group gap="md">
        <TextInput
          className="flex-1"
          leftSection={<Search size={16} />}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Search tracks, artists, or albums..."
          value={search}
        />
        <Switch
          checked={includeNonLibrary}
          color="orange"
          label="Show all tracks"
          onChange={(e) => setIncludeNonLibrary(e.currentTarget.checked)}
        />
        <Button
          color="orange"
          leftSection={<RefreshCw size={16} />}
          loading={isSyncing}
          onClick={() => syncPlays()}
          variant="light"
        >
          Refresh History
        </Button>
      </Group>

      <div className="overflow-x-auto">
        <Table
          highlightOnHover
          horizontalSpacing="md"
          striped
          verticalSpacing="sm"
          withTableBorder
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Track</Table.Th>
              <Table.Th>Artist</Table.Th>
              <Table.Th>Album</Table.Th>
              <Table.Th>Played At</Table.Th>
              <Table.Th>Duration</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td className="text-center" colSpan={6}>
                  <Text className="text-dark-1">No play history found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item) => (
                <PlayHistoryTableRow
                  isAddingToLibrary={addToLibraryMutation.isPending}
                  item={item}
                  key={item.id}
                  onAddToLibrary={handleAddToLibrary}
                  onPlay={handlePlayTrack}
                />
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Center>
          <Pagination
            color="orange"
            onChange={setPage}
            total={totalPages}
            value={page}
            withEdges
          />
        </Center>
      )}

      <Text className="text-dark-1 text-center" size="sm">
        Showing {items.length} of {data?.total || 0} plays
      </Text>
    </Stack>
  );
}
