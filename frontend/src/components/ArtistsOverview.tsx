import {
  Box,
  Card,
  Center,
  Grid,
  Group,
  Image,
  Loader,
  Pagination,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { Music, Play, Search, Star, User } from "lucide-react";

import {
  useLibraryControllerGetArtists,
  useLibraryControllerGetGenres,
} from "../data/api";
import { useDebouncedSearch } from "../hooks/useDebouncedSearch";
import { Route } from "../routes/~artists.index";
import { GenreFilter } from "./filters/GenreFilter";

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDate = (date: null | string | undefined) => {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString();
};

export function ArtistsOverview() {
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

  const { data, error, isLoading } = useLibraryControllerGetArtists({
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
          Error loading artists: {error.message}
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
        <Title order={2}>My Artists</Title>
        <Text className="text-gray-600">{data?.total || 0} artists</Text>
      </Group>

      <Group>
        <TextInput
          className="w-[300px]"
          leftSection={<Search size={16} />}
          onChange={(e) => setLocalSearch(e.currentTarget.value)}
          placeholder="Search artists..."
          value={localSearch}
        />

        <Select
          className="w-[150px]"
          data={[
            { label: "Artist Name", value: "name" },
            { label: "Track Count", value: "trackCount" },
            { label: "Album Count", value: "albumCount" },
            { label: "Play Count", value: "totalPlayCount" },
            { label: "Rating", value: "avgRating" },
            { label: "Last Played", value: "lastPlayed" },
          ]}
          label="Sort by"
          onChange={(value) =>
            updateSearch({
              sortBy: value as
                | "albumCount"
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
        {data?.artists.map((artist) => (
          <Grid.Col key={artist.name} span={{ base: 12, lg: 3, md: 4, sm: 6 }}>
            <Link
              className="no-underline"
              params={{ artist: artist.name }}
              to="/artists/$artist"
            >
              <Card
                className="h-full cursor-pointer p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                radius="md"
                shadow="sm"
                withBorder
              >
                <Card.Section className="mb-4">
                  <Box className="relative">
                    {artist.artistImage ? (
                      <Image
                        alt={artist.name}
                        className="h-[200px] object-cover"
                        fallbackSrc="/placeholder-album.svg"
                        src={artist.artistImage}
                      />
                    ) : (
                      <Center className="h-[200px] bg-gray-200">
                        <User color="gray" size={48} />
                      </Center>
                    )}
                    <Box className="absolute right-2 top-2 rounded bg-gray-900 px-2 py-1 opacity-90">
                      <Text className="text-xs font-semibold text-white">
                        {artist.trackCount} tracks
                      </Text>
                    </Box>
                  </Box>
                </Card.Section>

                <Stack gap="xs">
                  <div>
                    <Text className="font-semibold" lineClamp={1} size="md">
                      {artist.name}
                    </Text>
                    <Text className="text-gray-600" lineClamp={1} size="sm">
                      {artist.albumCount} albums
                    </Text>
                  </div>

                  <Group gap="xs" wrap="nowrap">
                    <Group gap={4}>
                      <Play size={14} />
                      <Text size="xs">{artist.totalPlayCount}</Text>
                    </Group>

                    {artist.avgRating && (
                      <Group gap={4}>
                        <Star size={14} />
                        <Text size="xs">{artist.avgRating}</Text>
                      </Group>
                    )}

                    <Text className="ml-auto text-xs text-gray-600">
                      {formatDuration(artist.totalDuration)}
                    </Text>
                  </Group>

                  <Text className="text-xs text-gray-600">
                    Last played: {formatDate(artist.lastPlayed)}
                  </Text>
                </Stack>
              </Card>
            </Link>
          </Grid.Col>
        ))}
      </Grid>

      {(!data?.artists || data.artists.length === 0) && (
        <Center className="h-[200px]">
          <Stack align="center" gap="md">
            <Music className="opacity-50" size={48} />
            <Text className="text-lg text-gray-600">
              {debouncedSearch
                ? "No artists found matching your search"
                : "No artists in your library yet"}
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
