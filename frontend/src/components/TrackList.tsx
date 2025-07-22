import {
  ActionIcon,
  Box,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-router";
import { Music, Search, Tag } from "lucide-react";
import { useState } from "react";

import {
  useLibraryControllerGetTracks,
  useLibraryControllerPlayTrack,
} from "../data/api";
import { Route } from "../routes/~tracks";
import { InlineTagEditor } from "./InlineTagEditor";
import { RatingSelector } from "./RatingSelector";
import { TagManager } from "./TagManager";

export function TrackList() {
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "addedAt",
    sortOrder = "desc",
  } = Route.useSearch();
  const [showTagManager, setShowTagManager] = useState(false);

  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, error, isLoading, refetch } = useLibraryControllerGetTracks({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    sortBy: sortBy as
      | "addedAt"
      | "album"
      | "artist"
      | "lastPlayedAt"
      | "rating"
      | "title"
      | "totalPlayCount",
    sortOrder,
  });

  const playTrackMutation = useLibraryControllerPlayTrack();

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

  const updateSearch = (
    newSearch: Partial<{
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?:
        | "addedAt"
        | "album"
        | "artist"
        | "lastPlayedAt"
        | "rating"
        | "title"
        | "totalPlayCount";
      sortOrder?: "asc" | "desc";
    }>
  ) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...newSearch,
        // Reset to page 1 when search changes
        ...(newSearch.search !== undefined && newSearch.page === undefined
          ? { page: 1 }
          : {}),
      }),
    });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: null | string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  if (error) {
    return (
      <Center h={400}>
        <Text c="red">Error loading tracks: {error.message}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      <div>
        <Text fw={700} mb="xs" size="lg">
          My Library
        </Text>
      </div>
      <Paper p="sm" radius="md" shadow="xs">
        <Group justify="space-between" mb="xs">
          <Group>
            <TextInput
              leftSection={<Search size={16} />}
              onChange={(e) => updateSearch({ search: e.currentTarget.value })}
              placeholder="Search tracks..."
              value={search}
              w={300}
            />
            <ActionIcon
              onClick={() => setShowTagManager(true)}
              size="lg"
              variant="light"
            >
              <Tag size={20} />
            </ActionIcon>
          </Group>

          <Group>
            <Select
              data={[
                { label: "Title", value: "title" },
                { label: "Artist", value: "artist" },
                { label: "Album", value: "album" },
                { label: "Date Added", value: "addedAt" },
                { label: "Last Played", value: "lastPlayedAt" },
                { label: "Play Count", value: "totalPlayCount" },
                { label: "Rating", value: "rating" },
              ]}
              label="Sort by"
              onChange={(value) =>
                updateSearch({ sortBy: (value as typeof sortBy) || "addedAt" })
              }
              value={sortBy}
              w={150}
            />

            <Select
              data={[
                { label: "Ascending", value: "asc" },
                { label: "Descending", value: "desc" },
              ]}
              label="Order"
              onChange={(value) =>
                updateSearch({ sortOrder: (value as "asc" | "desc") || "desc" })
              }
              value={sortOrder}
              w={120}
            />

            <Select
              data={["10", "20", "50", "100"]}
              label="Page size"
              onChange={(value) =>
                updateSearch({ page: 1, pageSize: parseInt(value || "20") })
              }
              value={pageSize.toString()}
              w={100}
            />
          </Group>
        </Group>

        {isLoading ? (
          <Center h={400}>
            <Loader size="lg" />
          </Center>
        ) : (
          <>
            <Text c="dimmed" mb="xs" size="sm">
              {data?.total || 0} tracks in library
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
                  {data?.tracks.map((track) => (
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

            {data && data.totalPages > 1 && (
              <Center mt="lg">
                <Pagination
                  boundaries={1}
                  onChange={(newPage) => updateSearch({ page: newPage })}
                  siblings={1}
                  total={data.totalPages}
                  value={page}
                />
              </Center>
            )}
          </>
        )}
      </Paper>

      <Modal
        onClose={() => setShowTagManager(false)}
        opened={showTagManager}
        size="md"
        title="Manage Tags"
      >
        <TagManager onTagsChange={refetch} />
      </Modal>
    </Stack>
  );
}
