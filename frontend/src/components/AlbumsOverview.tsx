import {
  Box,
  Card,
  Center,
  Grid,
  Group,
  Image,
  Loader,
  Stack,
  Text,
  TextInput,
  Select,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useNavigate } from '@tanstack/react-router';
import { Music, Play, Search, Star } from 'lucide-react';
import { useMemo } from 'react';

import { useLibraryControllerGetAlbums } from '../data/api';
import { Route } from '../routes/~albums';

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDate = (date: null | string | undefined) => {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString();
};

export function AlbumsOverview() {
  const { data: albums, isLoading, error } = useLibraryControllerGetAlbums();
  const navigate = useNavigate({ from: Route.fullPath });
  const { search = '', sortBy = 'name', sortOrder = 'asc' } = Route.useSearch();
  
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const updateSearch = (newSearch: Partial<{ search?: string; sortBy?: typeof sortBy; sortOrder?: typeof sortOrder }>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...newSearch,
      }),
    });
  };

  const filteredAndSortedAlbums = useMemo(() => {
    if (!albums) return [];
    
    // Filter
    let filtered = albums;
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = albums.filter(album => 
        album.name.toLowerCase().includes(searchLower) ||
        album.artist.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'artist':
          aVal = a.artist.toLowerCase();
          bVal = b.artist.toLowerCase();
          break;
        case 'trackCount':
          aVal = a.trackCount;
          bVal = b.trackCount;
          break;
        case 'totalPlayCount':
          aVal = a.totalPlayCount;
          bVal = b.totalPlayCount;
          break;
        case 'avgRating':
          aVal = a.avgRating || 0;
          bVal = b.avgRating || 0;
          break;
        case 'lastPlayed':
          aVal = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
          bVal = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
    return sorted;
  }, [albums, debouncedSearch, sortBy, sortOrder]);

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
        <Text c="dimmed">
          {filteredAndSortedAlbums.length} albums
        </Text>
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
            { label: 'Album Name', value: 'name' },
            { label: 'Artist', value: 'artist' },
            { label: 'Track Count', value: 'trackCount' },
            { label: 'Play Count', value: 'totalPlayCount' },
            { label: 'Rating', value: 'avgRating' },
            { label: 'Last Played', value: 'lastPlayed' },
          ]}
          label="Sort by"
          onChange={(value) => updateSearch({ sortBy: value as any })}
          value={sortBy}
          w={150}
        />
        
        <Select
          data={[
            { label: 'Ascending', value: 'asc' },
            { label: 'Descending', value: 'desc' },
          ]}
          label="Order"
          onChange={(value) => updateSearch({ sortOrder: value as any })}
          value={sortOrder}
          w={120}
        />
      </Group>

      <Grid>
        {filteredAndSortedAlbums.map((album) => (
          <Grid.Col key={`${album.name}-${album.artist}`} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Card h="100%" p="md" radius="md" shadow="sm" withBorder>
              <Card.Section mb="md">
                <Box pos="relative">
                  {album.albumArt ? (
                    <Image
                      alt={album.name}
                      fallbackSrc="/placeholder-album.svg"
                      h={200}
                      src={album.albumArt}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Center bg="gray.2" h={200}>
                      <Music color="gray" size={48} />
                    </Center>
                  )}
                  <Box
                    pos="absolute"
                    right={8}
                    top={8}
                    bg="dark.7"
                    px="xs"
                    py={4}
                    style={{ borderRadius: 4, opacity: 0.9 }}
                  >
                    <Text c="white" size="xs" fw={600}>
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
                  
                  <Text c="dimmed" size="xs" style={{ marginLeft: 'auto' }}>
                    {formatDuration(album.totalDuration)}
                  </Text>
                </Group>

                <Text c="dimmed" size="xs">
                  Last played: {formatDate(album.lastPlayed)}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {filteredAndSortedAlbums.length === 0 && (
        <Center h={200}>
          <Stack align="center" gap="md">
            <Music size={48} style={{ opacity: 0.5 }} />
            <Text c="dimmed" size="lg">
              {debouncedSearch ? 'No albums found matching your search' : 'No albums in your library yet'}
            </Text>
          </Stack>
        </Center>
      )}
    </Stack>
  );
}