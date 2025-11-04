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
import { Music, Search } from "lucide-react";

import {
  useLibraryControllerGetAlbums,
  useLibraryControllerGetGenres,
} from "../data/api";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { Route } from "../routes/~albums.index";
import { AlbumCard } from "./cards/AlbumCard";
import { GenreFilter } from "./filters/GenreFilter";
import { CardSkeletonGrid } from "./skeletons/CardSkeleton";

export function AlbumsOverview() {
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    genres = [],
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

  const { data, error, isLoading } = useLibraryControllerGetAlbums({
    genres,
    page,
    pageSize,
    search: debouncedSearch || "",
    sortBy,
    sortOrder,
  });

  const { data: genresData } = useLibraryControllerGetGenres();

  const updateSearch = (
    newSearch: Partial<{
      genres?: string[];
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
          Error loading albums: {error.message}
        </Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title className="text-dark-0" order={2}>
            My Albums
          </Title>
          <Text className="text-dark-1" size="sm">
            {isLoading
              ? "Loading..."
              : `${data?.total || 0} albums in your library`}
          </Text>
        </div>
      </Group>

      <Group>
        <TextInput
          className="w-[300px]"
          leftSection={<Search size={16} />}
          onChange={(e) => setLocalSearch(e.currentTarget.value)}
          placeholder="Search albums or artists..."
          value={localSearch}
        />

        <Select
          className="w-[150px]"
          data={[
            { label: "Album Name", value: "name" },
            { label: "Artist", value: "artist" },
            { label: "Track Count", value: "trackCount" },
            { label: "Play Count", value: "totalPlayCount" },
            { label: "Rating", value: "avgRating" },
            { label: "Last Played", value: "lastPlayed" },
          ]}
          label="Sort by"
          onChange={(value) =>
            updateSearch({
              sortBy: value as
                | "artist"
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

        {genresData && genresData.length > 0 && (
          <GenreFilter
            genres={genresData}
            onChange={(value) => updateSearch({ genres: value, page: 1 })}
            value={genres}
          />
        )}
      </Group>

      <Grid>
        {isLoading
          ? Array.from({ length: pageSize }).map((_, index) => (
              <Grid.Col key={index} span={{ base: 12, lg: 3, md: 4, sm: 6 }}>
                <CardSkeletonGrid count={1} />
              </Grid.Col>
            ))
          : data?.albums.map((album) => (
              <Grid.Col
                className="animate-fade-in"
                key={`${album.name}-${album.artist}`}
                span={{ base: 12, lg: 3, md: 4, sm: 6 }}
              >
                <Link
                  className="no-underline"
                  params={{ album: album.name, artist: album.artist }}
                  to="/albums/$artist/$album"
                >
                  <AlbumCard album={album} />
                </Link>
              </Grid.Col>
            ))}
      </Grid>

      {!isLoading && (!data?.albums || data.albums?.length === 0) && (
        <Center className="h-[400px]">
          <Stack align="center" gap="lg">
            <div className="p-6 rounded-full bg-dark-6">
              <Music color="var(--color-orange-5)" size={64} />
            </div>
            <div className="text-center">
              <Text className="text-xl font-bold text-dark-0 mb-2">
                {debouncedSearch
                  ? "No albums found"
                  : "No albums in your library"}
              </Text>
              <Text className="text-dark-1" size="sm">
                {debouncedSearch
                  ? "Try adjusting your search or filters"
                  : "Start syncing your library to see your albums here"}
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
            siblings={1}
            total={data.totalPages}
            value={page}
          />
        </Center>
      )}
    </Stack>
  );
}
