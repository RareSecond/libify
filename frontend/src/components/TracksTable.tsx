import { Center, Loader, Table } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";

import { useSpotifyPlayer } from "../contexts/SpotifyPlayerContext";
import { TrackDto } from "../data/api";
import { useColumnOrder } from "../hooks/useColumnOrder";
import { useTracksTableColumns } from "../hooks/useTracksTableColumns";

interface TracksTableProps {
  contextId?: string;
  contextType?: "album" | "artist" | "library" | "playlist";
  isLoading?: boolean;
  onRefetch?: () => void;
  onSortChange?: (columnId: string) => void;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tracks: TrackDto[];
}

export function TracksTable({
  contextId,
  contextType,
  isLoading,
  onRefetch,
  onSortChange,
  page = 1,
  pageSize = 20,
  search,
  sortBy,
  sortOrder,
  tracks,
}: TracksTableProps) {
  const [draggedColumn, setDraggedColumn] = useState<null | string>(null);
  const { currentTrack, isPlaying, playTrackList } = useSpotifyPlayer();

  const handlePlayTrack = async (trackTitle: string, spotifyId?: string) => {
    try {
      if (spotifyId && tracks.length > 0) {
        // Find the index of the clicked track in the current page
        const trackIndex = tracks.findIndex(
          (track) => track.spotifyId === spotifyId,
        );

        if (trackIndex >= 0) {
          // Backend will build queue and skip to correct position based on pagination
          const context = contextType
            ? {
                clickedIndex: trackIndex,
                contextId,
                contextType,
                pageNumber: page,
                pageSize,
                search,
                shuffle: false,
                sortBy,
                sortOrder,
              }
            : undefined;

          console.log(
            `[TracksTable] Playing track at index ${trackIndex}, page ${page}, pageSize ${pageSize}`,
            `sortBy: "${sortBy}", sortOrder: "${sortOrder}"`,
            `track: "${trackTitle}" (${spotifyId})`,
            `skip will be: ${(page - 1) * pageSize + trackIndex}`,
          );

          // Pass placeholder - backend ignores this and builds its own queue
          await playTrackList(["placeholder"], 0, context);

          notifications.show({
            color: "green",
            message: trackTitle,
            title: "Now playing",
          });
        }
      } else {
        // Fallback case - this shouldn't happen in normal usage since we always have Spotify IDs
        // But if it does, we can't play the track, so just show an error
        throw new Error("Cannot play track: missing Spotify ID");
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
    "sources",
  ];

  const { columnOrder, setColumnOrder } = useColumnOrder(defaultColumnOrder);

  const columns = useTracksTableColumns({
    currentTrack: currentTrack ? { id: currentTrack.id } : undefined,
    isPlaying,
    onRefetch,
  });

  const table = useReactTable({
    columnResizeMode: "onChange",
    columns,
    data: tracks,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onColumnOrderChange: setColumnOrder,
    state: {
      columnOrder,
      sorting: sortBy ? [{ desc: sortOrder === "desc", id: sortBy }] : [],
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
      <Center className="h-[400px]">
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
            {table.getFlatHeaders().map((header) => {
              const canSort = header.column.getCanSort();
              const isSorted = header.column.getIsSorted();

              return (
                <Table.Th
                  className={`relative select-none transition-opacity duration-200 ${draggedColumn ? "cursor-grabbing" : "cursor-grab"}`}
                  draggable
                  key={header.id}
                  onDragEnd={handleDragEnd}
                  onDragEnter={(e) => handleDragEnter(e, header.column.id)}
                  onDragOver={handleDragOver}
                  onDragStart={(e) => handleDragStart(e, header.column.id)}
                  onDrop={handleDrop}
                  // eslint-disable-next-line react/forbid-component-props
                  style={{
                    opacity: draggedColumn === header.column.id ? 0.5 : 1,
                    width: header.getSize(),
                  }}
                >
                  <div
                    className={`flex items-center gap-2 ${canSort ? "cursor-pointer" : ""}`}
                    onClick={(e) => {
                      if (canSort && onSortChange) {
                        e.stopPropagation();
                        onSortChange(header.column.id);
                      }
                    }}
                    onDragStart={(e) => e.stopPropagation()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {canSort && (
                      <span className="text-gray-400">
                        {isSorted === "desc" ? (
                          <ArrowDown size={14} />
                        ) : isSorted === "asc" ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </Table.Th>
              );
            })}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => {
            const isCurrentTrack = currentTrack?.id === row.original.spotifyId;
            return (
              <Table.Tr
                className={`cursor-pointer hover:bg-gray-50 ${isCurrentTrack && isPlaying ? "bg-blue-50/50" : ""}`}
                key={row.id}
                onClick={() =>
                  handlePlayTrack(row.original.title, row.original.spotifyId)
                }
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
