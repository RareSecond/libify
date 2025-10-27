import { ActionIcon, Group, Modal, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { useState } from "react";

import {
  useLibraryControllerGetGenres,
  useLibraryControllerGetTracks,
} from "../data/api";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { Route } from "../routes/~tracks";
import { GenreFilter } from "./filters/GenreFilter";
import { TagManager } from "./TagManager";
import { TracksTableWithControls } from "./TracksTableWithControls";

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

  const { debouncedSearch, setLocalSearch } = useDebouncedSearch(search, {
    onDebouncedChange: (value) => {
      navigate({
        replace: value === "" && search !== "",
        search: (prev) => ({ ...prev, page: 1, search: value }),
      });
    },
  });

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

  return (
    <Stack gap="sm">
      <div>
        <Text className="mb-2 font-bold" size="lg">
          My Library
        </Text>
      </div>

      <TracksTableWithControls
        contextType="library"
        data={data}
        error={error}
        extraControls={
          <Group>
            <ActionIcon
              onClick={() => setShowTagManager(true)}
              size="lg"
              variant="light"
            >
              <Tag size={20} />
            </ActionIcon>
            {genresData && genresData.length > 0 && (
              <GenreFilter
                genres={genresData}
                onChange={(value) => updateSearch({ genres: value, page: 1 })}
                value={genres}
              />
            )}
          </Group>
        }
        isLoading={isLoading}
        onPageChange={(newPage) => updateSearch({ page: newPage })}
        onPageSizeChange={(newPageSize) =>
          updateSearch({ page: 1, pageSize: newPageSize })
        }
        onRefetch={refetch}
        onSearchChange={setLocalSearch}
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
        page={page}
        pageSize={pageSize}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />

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
