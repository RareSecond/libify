import {
  Center,
  Grid,
  Group,
  Loader,
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
        <Text className="text-red-600">
          Error loading albums: {error.message}
        </Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center className="h-[400px]">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>My Albums</Title>
        <Text className="text-gray-600">{data?.total || 0} albums</Text>
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
        {data?.albums.map((album) => (
          <Grid.Col
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

      {(!data?.albums || data.albums.length === 0) && (
        <Center className="h-[200px]">
          <Stack align="center" gap="md">
            <Music className="opacity-50" size={48} />
            <Text className="text-lg text-gray-600">
              {debouncedSearch
                ? "No albums found matching your search"
                : "No albums in your library yet"}
            </Text>
          </Stack>
        </Center>
      )}

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
    </Stack>
  );
}
