import {
  ActionIcon,
  Center,
  Group,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useNavigate } from "@tanstack/react-router";
import { Search, Tag } from "lucide-react";
import { useState } from "react";

import { useLibraryControllerGetTracks } from "../data/api";
import { Route } from "../routes/~tracks";
import { TagManager } from "./TagManager";
import { TracksTable } from "./TracksTable";

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
    }>,
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

        <Text c="dimmed" mb="xs" size="sm">
          {data?.total || 0} tracks in library
        </Text>

        <TracksTable
          isLoading={isLoading}
          onRefetch={refetch}
          tracks={data?.tracks || []}
        />

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
