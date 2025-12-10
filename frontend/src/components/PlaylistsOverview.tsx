import {
  Center,
  Grid,
  Group,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { ListMusic, Search } from "lucide-react";

import { useLibraryControllerGetPlaylists } from "../data/api";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { Route } from "../routes/~playlists.index";
import { PlaylistCard } from "./cards/PlaylistCard";
import { CardSkeletonGrid } from "./skeletons/CardSkeleton";

export function PlaylistsOverview() {
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    page = 1,
    pageSize = 24,
    search = "",
    sortBy = "name",
    sortOrder = "asc",
  } = Route.useSearch();

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

  const { data, error, isLoading } = useLibraryControllerGetPlaylists({
    page,
    pageSize,
    search: debouncedSearch || "",
    sortBy,
    sortOrder,
  });

  const updateSearch = (
    newSearch: Partial<{
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: typeof sortBy;
      sortOrder?: typeof sortOrder;
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
        <Text className="text-red-500">
          Error loading playlists: {error.message}
        </Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title className="text-dark-0" order={2}>
            My Playlists
          </Title>
          <Text className="text-dark-1" size="sm">
            {isLoading
              ? "Loading..."
              : `${data?.total || 0} playlists in your library`}
          </Text>
        </div>
      </Group>

      <Group>
        <TextInput
          className="w-[300px]"
          leftSection={<Search size={16} />}
          onChange={(e) => setLocalSearch(e.currentTarget.value)}
          placeholder="Search playlists..."
          value={localSearch}
        />

        <Select
          className="w-[150px]"
          data={[
            { label: "Name", value: "name" },
            { label: "Track Count", value: "trackCount" },
            { label: "Play Count", value: "totalPlayCount" },
            { label: "Rating", value: "avgRating" },
            { label: "Last Played", value: "lastPlayed" },
          ]}
          label="Sort by"
          onChange={(value) =>
            updateSearch({
              sortBy: value as
                | "avgRating"
                | "lastPlayed"
                | "name"
                | "totalPlayCount"
                | "trackCount",
            })
          }
          value={sortBy}
        />

        <Select
          className="w-[120px]"
          data={[
            { label: "Ascending", value: "asc" },
            { label: "Descending", value: "desc" },
          ]}
          label="Order"
          onChange={(value) =>
            updateSearch({ sortOrder: value as "asc" | "desc" })
          }
          value={sortOrder}
        />

        <Select
          className="w-[100px]"
          data={["12", "24", "48", "96"]}
          label="Page size"
          onChange={(value) =>
            updateSearch({ page: 1, pageSize: parseInt(value || "24") })
          }
          value={pageSize.toString()}
        />
      </Group>

      <Grid>
        {isLoading
          ? Array.from({ length: pageSize }).map((_, index) => (
              <Grid.Col key={index} span={{ base: 12, lg: 3, md: 4, sm: 6 }}>
                <CardSkeletonGrid count={1} />
              </Grid.Col>
            ))
          : data?.playlists.map((playlist) => (
              <Grid.Col
                className="animate-fade-in"
                key={playlist.id}
                span={{ base: 12, lg: 3, md: 4, sm: 6 }}
              >
                <Link
                  className="no-underline"
                  params={{ id: playlist.id }}
                  to="/playlists/$id"
                >
                  <PlaylistCard playlist={playlist} />
                </Link>
              </Grid.Col>
            ))}
      </Grid>

      {!isLoading && (!data?.playlists || data.playlists?.length === 0) && (
        <Center className="h-[400px]">
          <Stack align="center" gap="lg">
            <div className="p-6 rounded-full bg-dark-6">
              <ListMusic color="var(--color-orange-5)" size={64} />
            </div>
            <div className="text-center">
              <Text className="text-xl font-bold text-dark-0 mb-2">
                {debouncedSearch
                  ? "No playlists found"
                  : "No playlists in your library"}
              </Text>
              <Text className="text-dark-1" size="sm">
                {debouncedSearch
                  ? "Try adjusting your search"
                  : "Start syncing your library to see your playlists here"}
              </Text>
            </div>
          </Stack>
        </Center>
      )}

      {data && data.totalPages > 1 && (
        <Center className="mt-6">
          <Pagination
            boundaries={1}
            color="orange"
            onChange={(newPage) => updateSearch({ page: newPage })}
            siblings={3}
            total={data.totalPages}
            value={page}
          />
        </Center>
      )}
    </Stack>
  );
}
