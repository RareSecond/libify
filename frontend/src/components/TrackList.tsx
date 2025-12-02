import { ActionIcon, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Play, Shuffle, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useSpotifyPlayer } from "@/contexts/SpotifyPlayerContext";
import { useOnboarding } from "@/hooks/useOnboarding";
import { trackLibraryFiltered, trackLibrarySearched } from "@/lib/posthog";

import {
  useLibraryControllerGetGenres,
  useLibraryControllerGetTracks,
} from "../data/api";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { Route } from "../routes/~tracks";
import { GenreFilter } from "./filters/GenreFilter";
import { OnboardingTooltips } from "./OnboardingTooltips";
import { TagManager } from "./TagManager";
import { TracksTableWithControls } from "./TracksTableWithControls";

export function TrackList() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { playTrackList } = useSpotifyPlayer();
  const {
    genres = [],
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "addedAt",
    sortOrder = "desc",
  } = Route.useSearch();
  const [showTagManager, setShowTagManager] = useState(false);
  const { advanceTooltip, currentTooltip, skipOnboarding } = useOnboarding();

  const prevDebouncedSearchRef = useRef<string | undefined>(undefined);
  const prevGenresRef = useRef<string[]>(genres);

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

  // Track search when debounced value changes and data is loaded
  useEffect(() => {
    if (
      debouncedSearch !== prevDebouncedSearchRef.current &&
      debouncedSearch !== undefined &&
      debouncedSearch !== "" &&
      !isLoading &&
      data
    ) {
      trackLibrarySearched(data.tracks.length > 0);
      prevDebouncedSearchRef.current = debouncedSearch;
    }
  }, [debouncedSearch, isLoading, data]);

  // Track genre filter changes
  useEffect(() => {
    const genresChanged =
      JSON.stringify(genres) !== JSON.stringify(prevGenresRef.current);
    if (genresChanged && genres.length > 0) {
      trackLibraryFiltered({ genre: genres.join(",") });
    }
    prevGenresRef.current = genres;
  }, [genres]);

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
    // Check if this is a sort action for onboarding
    if (newSearch.sortBy && currentTooltip === "sort") {
      advanceTooltip();
    }

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

  const handlePlayFromBeginning = async () => {
    // Backend will build the queue based on context
    await playTrackList(["placeholder"], {
      contextType: "library",
      search: debouncedSearch || undefined,
      shuffle: false,
      sortBy,
      sortOrder,
    });
  };

  const handlePlayShuffled = async () => {
    // Backend will build the shuffled queue based on context
    await playTrackList(["placeholder"], {
      contextType: "library",
      search: debouncedSearch || undefined,
      shuffle: true,
      // Note: sortBy/sortOrder ignored when shuffle is true
    });
  };

  return (
    <Stack gap="sm">
      <Group className="flex-wrap md:flex-nowrap" justify="space-between">
        <div>
          <Text className="mb-2 font-bold" size="lg">
            My Library
          </Text>
        </div>
        <Group gap="xs">
          <Button
            disabled={!data?.tracks || data.tracks.length === 0}
            leftSection={<Play size={16} />}
            onClick={handlePlayFromBeginning}
            size="sm"
            variant="filled"
          >
            Play
          </Button>
          <Button
            disabled={!data?.tracks || data.tracks.length === 0}
            leftSection={<Shuffle size={16} />}
            onClick={handlePlayShuffled}
            size="sm"
            variant="outline"
          >
            Shuffle
          </Button>
        </Group>
      </Group>

      <div className="relative">
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
              <GenreFilter
                genres={genresData || []}
                onChange={(value) => {
                  updateSearch({ genres: value, page: 1 });
                }}
                placeholder={
                  !genresData || genresData.length === 0
                    ? "No genres available"
                    : "Filter by genres"
                }
                value={genres}
              />
            </Group>
          }
          isLoading={isLoading}
          onPageChange={(newPage) => updateSearch({ page: newPage })}
          onPageSizeChange={(newPageSize) =>
            updateSearch({ page: 1, pageSize: newPageSize })
          }
          onRatingChange={() => {
            if (currentTooltip === "rate") {
              advanceTooltip();
            }
          }}
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
          search={localSearch}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />

        <OnboardingTooltips
          currentTooltip={currentTooltip}
          hasTracks={Boolean(data?.tracks && data.tracks.length > 0)}
          skipOnboarding={skipOnboarding}
        />
      </div>

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
