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
import { useDebouncedValue } from "@mantine/hooks";
import { Link, useNavigate } from "@tanstack/react-router";
import { Music, Play, Search, Star, User } from "lucide-react";

import { useLibraryControllerGetArtists } from "../data/api";
import { Route } from "../routes/~artists.index";

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
    page = 1,
    pageSize = 24,
    search = "",
    sortBy = "name",
    sortOrder = "asc",
  } = Route.useSearch();

  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, error, isLoading } = useLibraryControllerGetArtists({
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
      <Center h={400}>
        <Text c="red">Error loading artists: {error.message}</Text>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>My Artists</Title>
        <Text c="dimmed">{data?.total || 0} artists</Text>
      </Group>

      <Group>
        <TextInput
          leftSection={<Search size={16} />}
          onChange={(e) => updateSearch({ search: e.currentTarget.value })}
          placeholder="Search artists..."
          value={search}
          w={300}
        />

        <Select
          data={[
            { label: "Artist Name", value: "name" },
            { label: "Track Count", value: "trackCount" },
            { label: "Album Count", value: "albumCount" },
            { label: "Play Count", value: "totalPlayCount" },
            { label: "Rating", value: "avgRating" },
            { label: "Last Played", value: "lastPlayed" },
          ]}
          label="Sort by"
          onChange={(value) => updateSearch({ sortBy: value as any })}
          value={sortBy}
          w={150}
        />

        <Select
          data={[
            { label: "Ascending", value: "asc" },
            { label: "Descending", value: "desc" },
          ]}
          label="Order"
          onChange={(value) => updateSearch({ sortOrder: value as any })}
          value={sortOrder}
          w={120}
        />

        <Select
          data={["12", "24", "48", "96"]}
          label="Page size"
          onChange={(value) =>
            updateSearch({ page: 1, pageSize: parseInt(value || "24") })
          }
          value={pageSize.toString()}
          w={100}
        />
      </Group>

      <Grid>
        {data?.artists.map((artist) => (
          <Grid.Col key={artist.name} span={{ base: 12, lg: 3, md: 4, sm: 6 }}>
            <Link
              params={{ artist: artist.name }}
              style={{ textDecoration: "none" }}
              to="/artists/$artist"
            >
              <Card
                className="hover:shadow-lg hover:-translate-y-1"
                h="100%"
                p="md"
                radius="md"
                shadow="sm"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                withBorder
              >
                <Card.Section mb="md">
                  <Box pos="relative">
                    {artist.artistImage ? (
                      <Image
                        alt={artist.name}
                        fallbackSrc="/placeholder-album.svg"
                        h={200}
                        src={artist.artistImage}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Center bg="gray.2" h={200}>
                        <User color="gray" size={48} />
                      </Center>
                    )}
                    <Box
                      bg="dark.7"
                      pos="absolute"
                      px="xs"
                      py={4}
                      right={8}
                      style={{ borderRadius: 4, opacity: 0.9 }}
                      top={8}
                    >
                      <Text c="white" fw={600} size="xs">
                        {artist.trackCount} tracks
                      </Text>
                    </Box>
                  </Box>
                </Card.Section>

                <Stack gap="xs">
                  <div>
                    <Text fw={600} lineClamp={1} size="md">
                      {artist.name}
                    </Text>
                    <Text c="dimmed" lineClamp={1} size="sm">
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

                    <Text c="dimmed" size="xs" style={{ marginLeft: "auto" }}>
                      {formatDuration(artist.totalDuration)}
                    </Text>
                  </Group>

                  <Text c="dimmed" size="xs">
                    Last played: {formatDate(artist.lastPlayed)}
                  </Text>
                </Stack>
              </Card>
            </Link>
          </Grid.Col>
        ))}
      </Grid>

      {(!data?.artists || data.artists.length === 0) && (
        <Center h={200}>
          <Stack align="center" gap="md">
            <Music size={48} style={{ opacity: 0.5 }} />
            <Text c="dimmed" size="lg">
              {debouncedSearch
                ? "No artists found matching your search"
                : "No artists in your library yet"}
            </Text>
          </Stack>
        </Center>
      )}

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
    </Stack>
  );
}
