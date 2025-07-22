import {
  ActionIcon,
  Box,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "@tanstack/react-router";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Music, Search, Tag } from "lucide-react";
import { useMemo, useState } from "react";

import {
  TrackDto,
  useLibraryControllerGetTracks,
  useLibraryControllerPlayTrack,
} from "../data/api";
import { useColumnOrder } from "../hooks/useColumnOrder";
import { Route } from "../routes/~tracks";
import { InlineTagEditor } from "./InlineTagEditor";
import { RatingSelector } from "./RatingSelector";
import { TagManager } from "./TagManager";

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatDate = (date: null | string | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

export function TrackList() {
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    page = 1,
    pageSize = 20,
    search = "",
    sortBy = "addedAt",
    sortOrder = "desc",
  } = Route.useSearch();
  const [showTagManager, setShowTagManager] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<null | string>(null);

  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, error, isLoading, refetch } = useLibraryControllerGetTracks({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    sortBy: sortBy as
      | "addedAt"
      | "album"
      | "artist"
      | "lastPlayedAt"
      | "rating"
      | "title"
      | "totalPlayCount",
    sortOrder,
  });

  const playTrackMutation = useLibraryControllerPlayTrack();

  const handlePlayTrack = async (trackId: string, trackTitle: string) => {
    try {
      await playTrackMutation.mutateAsync({ trackId });
      notifications.show({
        color: "green",
        message: trackTitle,
        title: "Now playing",
      });
    } catch (error) {
      notifications.show({
        color: "red",
        message:
          (error as Error & { response?: { data?: { message?: string } } })
            .response?.data?.message ||
          "Please make sure Spotify is open on one of your devices",
        title: "Failed to play track",
      });
    }
  };

  const updateSearch = (
    newSearch: Partial<{
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?:
        | "addedAt"
        | "album"
        | "artist"
        | "lastPlayedAt"
        | "rating"
        | "title"
        | "totalPlayCount";
      sortOrder?: "asc" | "desc";
    }>
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

  const defaultColumnOrder = [
    'albumArt',
    'title',
    'artist',
    'album',
    'duration',
    'totalPlayCount',
    'lastPlayedAt',
    'rating',
    'tags',
  ];

  const { columnOrder, setColumnOrder } = useColumnOrder(defaultColumnOrder);

  const columns = useMemo<ColumnDef<TrackDto>[]>(() => [
    {
      cell: ({ row }) => (
        <Group gap="xs" wrap="nowrap">
          {row.original.albumArt ? (
            <Box
              h={36}
              style={{
                borderRadius: "4px",
                overflow: "hidden",
              }}
              w={36}
            >
              <Image
                alt={row.original.album || row.original.title}
                fallbackSrc="/placeholder-album.svg"
                fit="cover"
                h={36}
                src={row.original.albumArt}
                style={{ objectFit: "cover" }}
                w={36}
              />
            </Box>
          ) : (
            <Center
              bg="gray.2"
              h={36}
              style={{ borderRadius: "4px" }}
              w={36}
            >
              <Music color="gray" size={18} />
            </Center>
          )}
        </Group>
      ),
      enableSorting: false,
      header: '',
      id: 'albumArt',
      size: 50,
    },
    {
      accessorKey: 'title',
      cell: ({ getValue }) => (
        <Text fw={500} lineClamp={1} size="sm">
          {getValue() as string}
        </Text>
      ),
      header: 'Title',
      id: 'title',
      size: 200,
    },
    {
      accessorKey: 'artist',
      cell: ({ getValue }) => (
        <Text lineClamp={1} size="sm">
          {getValue() as string}
        </Text>
      ),
      header: 'Artist',
      id: 'artist',
      size: 150,
    },
    {
      accessorKey: 'album',
      cell: ({ getValue }) => (
        <Text c="dimmed" lineClamp={1} size="sm">
          {(getValue() as string) || '-'}
        </Text>
      ),
      header: 'Album',
      id: 'album',
      size: 150,
    },
    {
      accessorKey: 'duration',
      cell: ({ getValue }) => (
        <Text c="dimmed" size="sm">
          {formatDuration(getValue() as number)}
        </Text>
      ),
      header: 'Duration',
      id: 'duration',
      size: 80,
    },
    {
      accessorKey: 'totalPlayCount',
      cell: ({ getValue }) => (
        <Text size="sm" ta="center">
          {getValue() as number}
        </Text>
      ),
      header: 'Plays',
      id: 'totalPlayCount',
      size: 60,
    },
    {
      accessorKey: 'lastPlayedAt',
      cell: ({ getValue }) => (
        <Text c="dimmed" size="xs">
          {formatDate(getValue() as string | undefined)}
        </Text>
      ),
      header: 'Last Played',
      id: 'lastPlayedAt',
      size: 100,
    },
    {
      accessorKey: 'rating',
      cell: ({ row }) => (
        <RatingSelector
          onRatingChange={refetch}
          rating={row.original.rating ?? null}
          trackId={row.original.id}
        />
      ),
      enableSorting: false,
      header: 'Rating',
      id: 'rating',
      size: 120,
    },
    {
      accessorKey: 'tags',
      cell: ({ row }) => (
        <InlineTagEditor
          onTagsChange={refetch}
          trackId={row.original.id}
          trackTags={row.original.tags}
        />
      ),
      enableSorting: false,
      header: 'Tags',
      id: 'tags',
      size: 150,
    },
  ], [refetch]);

  const table = useReactTable({
    columnResizeMode: 'onChange',
    columns,
    data: data?.tracks || [],
    getCoreRowModel: getCoreRowModel(),
    onColumnOrderChange: setColumnOrder,
    state: {
      columnOrder,
    },
  });

  const handleDragStart = (column: string) => {
    setDraggedColumn(column);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumn) return;

    const newColumnOrder = [...columnOrder];
    const draggedIndex = newColumnOrder.indexOf(draggedColumn);
    const targetIndex = newColumnOrder.indexOf(targetColumn);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newColumnOrder.splice(draggedIndex, 1);
      newColumnOrder.splice(targetIndex, 0, draggedColumn);
      setColumnOrder(newColumnOrder);
    }
  };

  if (error) {
    return (
      <Center h={400}>
        <Text c="red">Error loading tracks: {error.message}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="sm">
      <div>
        <Text fw={700} mb="xs" size="lg">
          My Library
        </Text>
      </div>
      <Paper p="sm" radius="md" shadow="xs">
        <Group justify="space-between" mb="xs">
          <Group>
            <TextInput
              leftSection={<Search size={16} />}
              onChange={(e) => updateSearch({ search: e.currentTarget.value })}
              placeholder="Search tracks..."
              value={search}
              w={300}
            />
            <ActionIcon
              onClick={() => setShowTagManager(true)}
              size="lg"
              variant="light"
            >
              <Tag size={20} />
            </ActionIcon>
          </Group>

          <Group>
            <Select
              data={[
                { label: "Title", value: "title" },
                { label: "Artist", value: "artist" },
                { label: "Album", value: "album" },
                { label: "Date Added", value: "addedAt" },
                { label: "Last Played", value: "lastPlayedAt" },
                { label: "Play Count", value: "totalPlayCount" },
                { label: "Rating", value: "rating" },
              ]}
              label="Sort by"
              onChange={(value) =>
                updateSearch({ sortBy: (value as typeof sortBy) || "addedAt" })
              }
              value={sortBy}
              w={150}
            />

            <Select
              data={[
                { label: "Ascending", value: "asc" },
                { label: "Descending", value: "desc" },
              ]}
              label="Order"
              onChange={(value) =>
                updateSearch({ sortOrder: (value as "asc" | "desc") || "desc" })
              }
              value={sortOrder}
              w={120}
            />

            <Select
              data={["10", "20", "50", "100"]}
              label="Page size"
              onChange={(value) =>
                updateSearch({ page: 1, pageSize: parseInt(value || "20") })
              }
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
              <Table
                highlightOnHover
                horizontalSpacing="xs"
                striped
                verticalSpacing={6}
                withTableBorder
              >
                <Table.Thead>
                  <Table.Tr>
                    {table.getFlatHeaders().map((header) => (
                      <Table.Th
                        draggable
                        key={header.id}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragStart={() => handleDragStart(header.column.id)}
                        onDrop={(e) => handleDrop(e, header.column.id)}
                        style={{
                          cursor: 'grab',
                          position: 'relative',
                          userSelect: 'none',
                          width: header.getSize(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {table.getRowModel().rows.map((row) => (
                    <Table.Tr
                      className="hover:bg-gray-50"
                      key={row.id}
                      onClick={() => handlePlayTrack(row.original.id, row.original.title)}
                      style={{ cursor: "pointer" }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Table.Td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>

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
          </>
        )}
      </Paper>

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