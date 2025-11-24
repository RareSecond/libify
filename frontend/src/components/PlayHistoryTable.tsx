import {
  Avatar,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-router";
import { Music, RefreshCw, Search } from "lucide-react";
import { useState } from "react";

import { useSpotifyPlayer } from "../contexts/SpotifyPlayerContext";
import {
  PlayHistoryItemDto,
  useLibraryControllerGetPlayHistory,
} from "../data/api";
import { usePlayHistorySync } from "../hooks/usePlayHistorySync";

export function PlayHistoryTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { playTrackList } = useSpotifyPlayer();

  const { data, isLoading, refetch } = useLibraryControllerGetPlayHistory({
    page,
    pageSize,
    search: debouncedSearch || undefined,
  });

  const { isSyncing, syncPlays } = usePlayHistorySync(refetch);

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

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      year: "numeric",
    });
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
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td className="text-center" colSpan={5}>
                  <Text className="text-dark-1">No play history found</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item) => (
                <Table.Tr
                  className="cursor-pointer hover:bg-dark-6 transition-colors"
                  key={item.id}
                  onClick={() =>
                    handlePlayTrack(
                      item.trackTitle,
                      item.trackSpotifyId,
                      item.trackId,
                    )
                  }
                >
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      {item.trackAlbumArt ? (
                        <Avatar
                          radius="sm"
                          size="md"
                          src={item.trackAlbumArt}
                        />
                      ) : (
                        <Avatar
                          className="bg-gradient-to-br from-orange-6 to-orange-8"
                          radius="sm"
                          size="md"
                          variant="filled"
                        >
                          <Music size={20} />
                        </Avatar>
                      )}
                      <Text
                        className="font-medium text-dark-0"
                        lineClamp={1}
                        size="sm"
                      >
                        {item.trackTitle}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      className="text-dark-1 cursor-pointer hover:underline hover:text-orange-5"
                      lineClamp={1}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({
                          params: { artist: item.trackArtist },
                          to: "/artists/$artist",
                        });
                      }}
                      size="sm"
                    >
                      {item.trackArtist}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      className="text-dark-1 cursor-pointer hover:underline hover:text-orange-5"
                      lineClamp={1}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.trackAlbum) {
                          navigate({
                            params: {
                              album: item.trackAlbum,
                              artist: item.trackArtist,
                            },
                            to: "/albums/$artist/$album",
                          });
                        }
                      }}
                      size="sm"
                    >
                      {item.trackAlbum || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color="orange" size="sm" variant="dot">
                      {formatDate(item.playedAt)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text className="text-dark-1" size="sm">
                      {formatDuration(item.trackDuration)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
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
