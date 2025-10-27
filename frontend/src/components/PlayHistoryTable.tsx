import {
  Avatar,
  Badge,
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
import { Music, Search } from "lucide-react";
import { useState } from "react";

import { useSpotifyPlayer } from "../contexts/SpotifyPlayerContext";
import {
  PlayHistoryItemDto,
  useLibraryControllerGetPlayHistory,
} from "../data/api";

export function PlayHistoryTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { playTrackList } = useSpotifyPlayer();

  const { data, isLoading } = useLibraryControllerGetPlayHistory({
    page,
    pageSize,
    search: debouncedSearch || undefined,
  });

  const handlePlayTrack = async (
    trackTitle: string,
    spotifyId: string,
    trackId: string,
  ) => {
    try {
      await playTrackList(
        [{ spotifyUri: `spotify:track:${spotifyId}`, trackId }],
        0,
      );

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
        <Loader size="lg" />
      </Center>
    );
  }

  const totalPages = data?.totalPages || 1;
  const items: PlayHistoryItemDto[] = data?.items || [];

  return (
    <Stack gap="md">
      <TextInput
        leftSection={<Search size={16} />}
        onChange={(e) => setSearch(e.currentTarget.value)}
        placeholder="Search tracks, artists, or albums..."
        value={search}
      />

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
                <Table.Td className="text-center text-gray-500" colSpan={5}>
                  No play history found
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((item) => (
                <Table.Tr
                  className="cursor-pointer hover:bg-gray-50"
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
                        <Avatar color="blue" radius="sm" size="md">
                          <Music size={20} />
                        </Avatar>
                      )}
                      <Text className="font-medium" lineClamp={1} size="sm">
                        {item.trackTitle}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      className="cursor-pointer hover:underline"
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
                      className="cursor-pointer hover:underline"
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
                    <Badge color="gray" size="sm" variant="light">
                      {formatDate(item.playedAt)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text className="text-gray-500" size="sm">
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
            onChange={setPage}
            total={totalPages}
            value={page}
            withEdges
          />
        </Center>
      )}

      <Text className="text-center text-gray-500" size="sm">
        Showing {items.length} of {data?.total || 0} plays
      </Text>
    </Stack>
  );
}
