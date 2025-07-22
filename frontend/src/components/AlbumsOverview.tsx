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
import { Music, Play, Search, Star } from "lucide-react";

import { useLibraryControllerGetAlbums } from "../data/api";
import { Route } from "../routes/~albums.index";

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

export function AlbumsOverview() {
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    page = 1,
    pageSize = 24,
    search = "",
    sortBy = "name",
    sortOrder = "asc",
  } = Route.useSearch();

  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, error, isLoading } = useLibraryControllerGetAlbums({
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
        <Text c="red">Error loading albums: {error.message}</Text>
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
        <Title order={2}>My Albums</Title>
        <Text c="dimmed">{data?.total || 0} albums</Text>
      </Group>

      <Group>
        <TextInput
          leftSection={<Search size={16} />}
          onChange={(e) => updateSearch({ search: e.currentTarget.value })}
          placeholder="Search albums or artists..."
          value={search}
          w={300}
        />

        <Select
          data={[
            { label: "Album Name", value: "name" },
            { label: "Artist", value: "artist" },
            { label: "Track Count", value: "trackCount" },
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
        {data?.albums.map((album) => (
          <Grid.Col
            key={`${album.name}-${album.artist}`}
            span={{ base: 12, lg: 3, md: 4, sm: 6 }}
          >
            <Link
              params={{
                album: album.name,
                artist: album.artist,
              }}
              style={{ textDecoration: "none" }}
              to="/albums/$artist/$album"
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
                    {album.albumArt ? (
                      <Image
                        alt={album.name}
                        fallbackSrc="/placeholder-album.svg"
                        h={200}
                        src={album.albumArt}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Center bg="gray.2" h={200}>
                        <Music color="gray" size={48} />
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
                        {album.trackCount} tracks
                      </Text>
                    </Box>
                  </Box>
                </Card.Section>

                <Stack gap="xs">
                  <div>
                    <Text fw={600} lineClamp={1} size="md">
                      {album.name}
                    </Text>
                    <Text c="dimmed" lineClamp={1} size="sm">
                      {album.artist}
                    </Text>
                  </div>

                  <Group gap="xs" wrap="nowrap">
                    <Group gap={4}>
                      <Play size={14} />
                      <Text size="xs">{album.totalPlayCount}</Text>
                    </Group>

                    {album.avgRating && (
                      <Group gap={4}>
                        <Star size={14} />
                        <Text size="xs">{album.avgRating}</Text>
                      </Group>
                    )}

                    <Text c="dimmed" size="xs" style={{ marginLeft: "auto" }}>
                      {formatDuration(album.totalDuration)}
                    </Text>
                  </Group>

                  <Text c="dimmed" size="xs">
                    Last played: {formatDate(album.lastPlayed)}
                  </Text>
                </Stack>
              </Card>
            </Link>
          </Grid.Col>
        ))}
      </Grid>

      {(!data?.albums || data.albums.length === 0) && (
        <Center h={200}>
          <Stack align="center" gap="md">
            <Music size={48} style={{ opacity: 0.5 }} />
            <Text c="dimmed" size="lg">
              {debouncedSearch
                ? "No albums found matching your search"
                : "No albums in your library yet"}
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
