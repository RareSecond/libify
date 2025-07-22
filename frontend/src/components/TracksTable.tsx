import { Box, Center, Group, Image, Loader, Table, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Music, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useSpotifyPlayer } from "../contexts/SpotifyPlayerContext";
import { TrackDto, useLibraryControllerPlayTrack } from "../data/api";
import { useColumnOrder } from "../hooks/useColumnOrder";
import { InlineTagEditor } from "./InlineTagEditor";
import { RatingSelector } from "./RatingSelector";

interface TracksTableProps {
  isLoading?: boolean;
  onRefetch?: () => void;
  tracks: TrackDto[];
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatDate = (date: null | string | undefined) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

export function TracksTable({
  isLoading,
  onRefetch,
  tracks,
}: TracksTableProps) {
  const [draggedColumn, setDraggedColumn] = useState<null | string>(null);
  const playTrackMutation = useLibraryControllerPlayTrack();
  const { playTrackList, currentTrack, isPlaying } = useSpotifyPlayer();

  const handlePlayTrack = async (trackId: string, trackTitle: string, spotifyId?: string) => {
    try {
      if (spotifyId && tracks.length > 0) {
        // Build list of all track URIs
        const trackUris = tracks
          .filter(track => track.spotifyId)
          .map(track => `spotify:track:${track.spotifyId}`);
        
        if (trackUris.length > 0) {
          // Find the index of the clicked track in the filtered list
          const clickedTrackUri = `spotify:track:${spotifyId}`;
          const trackIndex = trackUris.findIndex(uri => uri === clickedTrackUri);
          
          // Play the entire track list starting from the clicked track
          await playTrackList(trackUris, trackIndex >= 0 ? trackIndex : 0);
          notifications.show({
            color: "green",
            message: trackTitle,
            title: "Now playing",
          });
        }
      } else {
        // Fallback to backend API for single track
        await playTrackMutation.mutateAsync({ trackId });
        notifications.show({
          color: "green",
          message: trackTitle,
          title: "Now playing",
        });
      }
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

  const defaultColumnOrder = [
    "albumArt",
    "title",
    "artist",
    "album",
    "duration",
    "totalPlayCount",
    "lastPlayedAt",
    "rating",
    "tags",
  ];

  const { columnOrder, setColumnOrder } = useColumnOrder(defaultColumnOrder);

  const columns = useMemo<ColumnDef<TrackDto>[]>(
    () => [
      {
        cell: ({ row }) => {
          const isCurrentTrack = currentTrack?.id === row.original.spotifyId;
          return (
            <Group gap="xs" wrap="nowrap">
              {row.original.albumArt ? (
                <Box
                  h={36}
                  style={{
                    borderRadius: "4px",
                    overflow: "hidden",
                    position: "relative",
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
                  {isCurrentTrack && isPlaying && (
                    <Center
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        color: "white",
                      }}
                    >
                      <Volume2 size={20} />
                    </Center>
                  )}
                </Box>
              ) : (
                <Center bg="gray.2" h={36} style={{ borderRadius: "4px" }} w={36}>
                  {isCurrentTrack && isPlaying ? (
                    <Volume2 size={18} />
                  ) : (
                    <Music color="gray" size={18} />
                  )}
                </Center>
              )}
            </Group>
          );
        },
        enableSorting: false,
        header: "",
        id: "albumArt",
        size: 50,
      },
      {
        accessorKey: "title",
        cell: ({ getValue, row }) => {
          const isCurrentTrack = currentTrack?.id === row.original.spotifyId;
          return (
            <Text 
              fw={500} 
              lineClamp={1} 
              size="sm"
              c={isCurrentTrack && isPlaying ? "blue" : undefined}
            >
              {getValue() as string}
            </Text>
          );
        },
        header: "Title",
        id: "title",
        size: 200,
      },
      {
        accessorKey: "artist",
        cell: ({ getValue }) => (
          <Text lineClamp={1} size="sm">
            {getValue() as string}
          </Text>
        ),
        header: "Artist",
        id: "artist",
        size: 150,
      },
      {
        accessorKey: "album",
        cell: ({ getValue }) => (
          <Text c="dimmed" lineClamp={1} size="sm">
            {(getValue() as string) || "-"}
          </Text>
        ),
        header: "Album",
        id: "album",
        size: 150,
      },
      {
        accessorKey: "duration",
        cell: ({ getValue }) => (
          <Text c="dimmed" size="sm">
            {formatDuration(getValue() as number)}
          </Text>
        ),
        header: "Duration",
        id: "duration",
        size: 80,
      },
      {
        accessorKey: "totalPlayCount",
        cell: ({ getValue }) => (
          <Text size="sm" ta="center">
            {getValue() as number}
          </Text>
        ),
        header: "Plays",
        id: "totalPlayCount",
        size: 60,
      },
      {
        accessorKey: "lastPlayedAt",
        cell: ({ getValue }) => (
          <Text c="dimmed" size="xs">
            {formatDate(getValue() as string | undefined)}
          </Text>
        ),
        header: "Last Played",
        id: "lastPlayedAt",
        size: 100,
      },
      {
        accessorKey: "rating",
        cell: ({ row }) => (
          <RatingSelector
            onRatingChange={onRefetch}
            rating={row.original.rating ?? null}
            trackId={row.original.id}
          />
        ),
        enableSorting: false,
        header: "Rating",
        id: "rating",
        size: 120,
      },
      {
        accessorKey: "tags",
        cell: ({ row }) => (
          <InlineTagEditor
            onTagsChange={onRefetch}
            trackId={row.original.id}
            trackTags={row.original.tags}
          />
        ),
        enableSorting: false,
        header: "Tags",
        id: "tags",
        size: 150,
      },
    ],
    [onRefetch, currentTrack, isPlaying]
  );

  const table = useReactTable({
    columnResizeMode: "onChange",
    columns,
    data: tracks,
    getCoreRowModel: getCoreRowModel(),
    onColumnOrderChange: setColumnOrder,
    state: {
      columnOrder,
    },
  });

  const handleDragStart = (e: React.DragEvent, column: string) => {
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumn) return;

    const newColumnOrder = [...columnOrder];
    const draggedIndex = newColumnOrder.indexOf(draggedColumn);
    const targetIndex = newColumnOrder.indexOf(targetColumn);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged column and insert at target position
      newColumnOrder.splice(draggedIndex, 1);
      newColumnOrder.splice(targetIndex, 0, draggedColumn);
      setColumnOrder(newColumnOrder);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
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
                onDragEnter={(e) => handleDragEnter(e, header.column.id)}
                onDragOver={handleDragOver}
                onDragStart={(e) => handleDragStart(e, header.column.id)}
                onDrop={handleDrop}
                style={{
                  cursor: draggedColumn ? "grabbing" : "grab",
                  opacity: draggedColumn === header.column.id ? 0.5 : 1,
                  position: "relative",
                  transition: "opacity 0.2s",
                  userSelect: "none",
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
          {table.getRowModel().rows.map((row) => {
            const isCurrentTrack = currentTrack?.id === row.original.spotifyId;
            return (
              <Table.Tr
                className="hover:bg-gray-50"
                key={row.id}
                onClick={() =>
                  handlePlayTrack(row.original.id, row.original.title, row.original.spotifyId)
                }
                style={{ 
                  cursor: "pointer",
                  backgroundColor: isCurrentTrack && isPlaying ? "rgba(0, 123, 255, 0.05)" : undefined,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                ))}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  );
}
