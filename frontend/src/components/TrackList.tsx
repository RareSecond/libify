import { Badge, Center, Group, Image, Loader, Pagination, Paper, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Clock, Music, Search, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useLibraryControllerGetTracks } from '../data/api';

export function TrackList() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('addedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [debouncedSearch] = useDebouncedValue(search, 300);
  
  const { data, error, isLoading } = useLibraryControllerGetTracks({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    sortBy: sortBy as 'addedAt' | 'album' | 'artist' | 'lastPlayedAt' | 'rating' | 'title' | 'totalPlayCount',
    sortOrder,
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: null | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const renderRating = (rating: null | number | undefined) => {
    if (!rating) return <Text c="dimmed" size="sm">-</Text>;
    return (
      <Group gap={2}>
        {[...Array(5)].map((_, i) => (
          <Star
            color={i < rating ? 'gold' : 'gray'}
            fill={i < rating ? 'gold' : 'transparent'}
            key={i}
            size={14}
          />
        ))}
      </Group>
    );
  };

  if (error) {
    return (
      <Center h={400}>
        <Text c="red">Error loading tracks: {error.message}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Paper p="md" shadow="xs">
        <Group justify="space-between" mb="md">
          <TextInput
            leftSection={<Search size={16} />}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search tracks..."
            value={search}
            w={300}
          />
          
          <Group>
            <Select
              data={[
                { label: 'Title', value: 'title' },
                { label: 'Artist', value: 'artist' },
                { label: 'Album', value: 'album' },
                { label: 'Date Added', value: 'addedAt' },
                { label: 'Last Played', value: 'lastPlayedAt' },
                { label: 'Play Count', value: 'totalPlayCount' },
                { label: 'Rating', value: 'rating' },
              ]}
              label="Sort by"
              onChange={(value) => setSortBy(value || 'addedAt')}
              value={sortBy}
              w={150}
            />
            
            <Select
              data={[
                { label: 'Ascending', value: 'asc' },
                { label: 'Descending', value: 'desc' },
              ]}
              label="Order"
              onChange={(value) => setSortOrder((value as 'asc' | 'desc') || 'desc')}
              value={sortOrder}
              w={120}
            />
            
            <Select
              data={['10', '20', '50', '100']}
              label="Page size"
              onChange={(value) => setPageSize(parseInt(value || '20'))}
              value={pageSize.toString()}
              w={100}
            />
          </Group>
        </Group>

        {isLoading ? (
          <Center h={400}>
            <Loader size="lg" />
          </Center>
        ) : (
          <>
            <Text c="dimmed" mb="xs" size="sm">
              {data?.total || 0} tracks in library
            </Text>
            
            <div className="overflow-x-auto">
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={50}></Table.Th>
                    <Table.Th>Title</Table.Th>
                    <Table.Th>Artist</Table.Th>
                    <Table.Th>Album</Table.Th>
                    <Table.Th>Duration</Table.Th>
                    <Table.Th>Plays</Table.Th>
                    <Table.Th>Last Played</Table.Th>
                    <Table.Th>Rating</Table.Th>
                    <Table.Th>Tags</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data?.tracks.map((track: any) => (
                    <Table.Tr key={track.id}>
                      <Table.Td>
                        {track.albumArt ? (
                          <Image
                            alt={track.album || track.title}
                            fallbackSrc="/placeholder-album.svg"
                            h={40}
                            radius="sm"
                            src={track.albumArt}
                            w={40}
                          />
                        ) : (
                          <Center bg="gray.2" h={40} w={40} style={{ borderRadius: '4px' }}>
                            <Music color="gray" size={20} />
                          </Center>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500} lineClamp={1}>
                          {track.title}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text lineClamp={1}>{track.artist}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text lineClamp={1}>{track.album || '-'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Clock size={14} />
                          <Text size="sm">{formatDuration(track.duration)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{track.totalPlayCount}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(track.lastPlayedAt)}</Text>
                      </Table.Td>
                      <Table.Td>{renderRating(track.rating)}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          {track.tags.map((tag: any) => (
                            <Badge
                              color={tag.color || 'gray'}
                              key={tag.id}
                              size="xs"
                              variant="light"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

            {data && data.totalPages > 1 && (
              <Center mt="lg">
                <Pagination
                  boundaries={1}
                  onChange={setPage}
                  siblings={1}
                  total={data.totalPages}
                  value={page}
                />
              </Center>
            )}
          </>
        )}
      </Paper>
    </Stack>
  );
}