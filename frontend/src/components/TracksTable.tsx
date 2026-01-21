import { Center, Loader, Table } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  getCoreRowModel,
  Updater,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";

import { TrackDto } from "../data/api";
import { useColumnOrder } from "../hooks/useColumnOrder";
import { useColumnSizing } from "../hooks/useColumnSizing";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { useTracksTableColumns } from "../hooks/useTracksTableColumns";
import { TracksTableBody } from "./TracksTableBody";
import { TracksTableHeader } from "./TracksTableHeader";

interface TracksTableProps {
  columnVisibility?: VisibilityState;
  contextId?: string;
  contextType?: "album" | "artist" | "library" | "playlist" | "smart_playlist";
  genres?: string[];
  isAllOnPageSelected?: boolean;
  isLoading?: boolean;
  isSomeOnPageSelected?: boolean;
  isTrackSelected?: (trackId: string) => boolean;
  onColumnVisibilityChange?: (updaterOrValue: Updater<VisibilityState>) => void;
  onRatingChange?: () => void;
  onRefetch?: () => void;
  onSelectAllOnPage?: () => void;
  onSortChange?: (columnId: string) => void;
  onToggleTrack?: (trackId: string) => void;
  page?: number;
  pageSize?: number;
  search?: string;
  showSelection?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tracks: TrackDto[];
}

export function TracksTable({
  columnVisibility,
  contextId,
  contextType,
  genres,
  isAllOnPageSelected,
  isLoading,
  isSomeOnPageSelected,
  isTrackSelected,
  onColumnVisibilityChange,
  onRatingChange,
  onRefetch,
  onSelectAllOnPage,
  onSortChange,
  onToggleTrack,
  page = 1,
  pageSize = 20,
  search,
  showSelection = false,
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
                genres,
                pageNumber: page,
                pageSize,
                search,
                shuffle: false,
                sortBy,
                sortOrder,
              }
            : undefined;

          // Pass placeholder - backend ignores this and builds its own queue
          await playTrackList(["placeholder"], context);

          notifications.show({
            color: "orange",
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
    ...(showSelection ? ["select"] : []),
    "albumArt",
    "title",
    "artist",
    "album",
    "duration",
    "totalPlayCount",
    "lastPlayedAt",
    "addedAt",
    "rating",
    "tags",
    "sources",
    // Audio features (hidden by default)
    "tempo",
    "energy",
    "danceability",
    "valence",
    "acousticness",
    "instrumentalness",
    "speechiness",
    "liveness",
  ];

  const { columnOrder, setColumnOrder } = useColumnOrder(defaultColumnOrder);
  const { columnSizing, setColumnSizing } = useColumnSizing();

  // Handle Spotify track relinking: If linked_from exists, use the original track ID
  // See: https://developer.spotify.com/documentation/web-api/concepts/track-relinking
  const originalSpotifyId = currentTrack?.linked_from?.id || currentTrack?.id;

  const columns = useTracksTableColumns({
    currentTrack: currentTrack ? { id: originalSpotifyId } : undefined,
    isAllOnPageSelected,
    isPlaying,
    isSomeOnPageSelected,
    isTrackSelected,
    onRatingChange,
    onRefetch,
    onSelectAllOnPage,
    onToggleTrack,
    showSelection,
  });

  const table = useReactTable({
    columnResizeMode: "onChange",
    columns,
    data: tracks,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange,
    state: {
      columnOrder,
      columnSizing,
      columnVisibility,
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
    <div className="overflow-x-auto -mx-2 md:mx-0">
      <Table
        highlightOnHover
        horizontalSpacing="xs"
        striped
        verticalSpacing="xs"
        withTableBorder
      >
        <TracksTableHeader
          draggedColumn={draggedColumn}
          headers={table.getFlatHeaders()}
          onDragEnd={handleDragEnd}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onSortChange={onSortChange}
          table={table}
        />
        <TracksTableBody
          isPlaying={isPlaying}
          onPlayTrack={handlePlayTrack}
          originalSpotifyId={originalSpotifyId}
          rows={table.getRowModel().rows}
        />
      </Table>
    </div>
  );
}
