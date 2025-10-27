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
import { useNavigate } from "@tanstack/react-router";
import { Search, Tag } from "lucide-react";
import { useState } from "react";

import {
  useLibraryControllerGetGenres,
  useLibraryControllerGetTracks,
} from "../data/api";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { Route } from "../routes/~tracks";
import { GenreFilter } from "./filters/GenreFilter";
import { TagManager } from "./TagManager";
import { TracksTable } from "./TracksTable";

export function TrackList() {
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    genres = [],
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "addedAt",
    sortOrder = "desc",
  } = Route.useSearch();
  const [showTagManager, setShowTagManager] = useState(false);

  const { debouncedSearch, localSearch, setLocalSearch } = useDebouncedSearch(
    search,
    {
      onDebouncedChange: (value) => {
        navigate({
          replace: value === "" && search !== "",
          search: (prev) => ({ ...prev, page: 1, search: value }),
        });
      },
    },
  );

  const { data, error, isLoading, refetch } = useLibraryControllerGetTracks({
    genres,
    page,
    pageSize,
    search: debouncedSearch || undefined,
    sortBy: sortBy as
      | "addedAt"
      | "album"
      | "artist"
      | "duration"
      | "lastPlayedAt"
      | "rating"
      | "title"
      | "totalPlayCount",
    sortOrder,
  });

  const { data: genresData } = useLibraryControllerGetGenres();

  const updateSearch = (
    newSearch: Partial<{
      genres?: string[];
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?:
        | "addedAt"
        | "album"
        | "artist"
        | "duration"
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
      <Center className="h-[400px]">
        <Text className="text-red-600">
          Error loading tracks: {error.message}
        </Text>
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      <div>
        <Text className="mb-2 font-bold" size="lg">
          My Library
        </Text>
      </div>
      <Paper className="p-4" radius="md" shadow="xs">
        <Group className="mb-2" justify="space-between">
          <Group>
            <TextInput
              className="w-[300px]"
              leftSection={<Search size={16} />}
              onChange={(e) => setLocalSearch(e.currentTarget.value)}
              placeholder="Search tracks..."
              value={localSearch}
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
              className="w-[100px]"
              data={["10", "20", "50", "100"]}
              label="Page size"
              onChange={(value) =>
                updateSearch({ page: 1, pageSize: parseInt(value || "20") })
              }
              value={pageSize.toString()}
            />

            {genresData && genresData.length > 0 && (
              <GenreFilter
                genres={genresData}
                onChange={(value) => updateSearch({ genres: value, page: 1 })}
                value={genres}
              />
            )}
          </Group>
        </Group>

        <Text className="mb-2 text-gray-600" size="sm">
          {data?.total || 0} tracks in library
        </Text>

        <TracksTable
          contextType="library"
          isLoading={isLoading}
          onRefetch={refetch}
          onSortChange={(columnId) => {
            // If clicking the same column, toggle sort order
            if (columnId === sortBy) {
              updateSearch({ sortOrder: sortOrder === "asc" ? "desc" : "asc" });
            } else {
              // If clicking a new column, set to desc by default
              updateSearch({
                sortBy: columnId as typeof sortBy,
                sortOrder: "desc",
              });
            }
          }}
          search={debouncedSearch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          tracks={data?.tracks || []}
        />

        {data && data.totalPages > 1 && (
          <Center className="mt-6">
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
