import { useDisclosure } from "@mantine/hooks";
import { ReactNode, useEffect, useMemo } from "react";

import { BulkOperationFilterDto, TrackDto } from "../data/api";
import { useBulkOperations } from "../hooks/useBulkOperations";
import {
  SelectionRenderProps,
  useTrackSelection,
} from "../hooks/useTrackSelection";
import { BulkActionBar } from "./BulkActionBar";
import { BulkRatingModal } from "./BulkRatingModal";
import { BulkTagModal } from "./BulkTagModal";

interface BulkSelectionWrapperProps {
  children: (selection: SelectionRenderProps) => ReactNode;
  contextId?: string;
  contextType?: "album" | "artist" | "library" | "playlist" | "smart_playlist";
  currentFilters: Omit<
    BulkOperationFilterDto,
    "albumId" | "artistId" | "playlistId" | "spotifyPlaylistId"
  >;
  enabled: boolean;
  onRefetch?: () => void;
  page: number;
  search: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  totalTracks: number;
  tracks: TrackDto[];
}

export function BulkSelectionWrapper({
  children,
  contextId,
  contextType,
  currentFilters,
  enabled,
  onRefetch,
  page,
  search,
  sortBy,
  sortOrder,
  totalTracks,
  tracks,
}: BulkSelectionWrapperProps) {
  // Modals
  const [ratingModalOpened, ratingModalHandlers] = useDisclosure(false);
  const [tagModalOpened, tagModalHandlers] = useDisclosure(false);

  // Bulk operations
  const { bulkRateMutation, bulkTagMutation } = useBulkOperations();

  // Build full filter including context
  const fullFilters = useMemo<BulkOperationFilterDto>(() => {
    const filters: BulkOperationFilterDto = { ...currentFilters };
    if (contextType === "album" && contextId) {
      filters.albumId = contextId;
    } else if (contextType === "artist" && contextId) {
      filters.artistId = contextId;
    } else if (contextType === "playlist" && contextId) {
      filters.spotifyPlaylistId = contextId;
    } else if (contextType === "smart_playlist" && contextId) {
      filters.playlistId = contextId;
    }
    return filters;
  }, [currentFilters, contextType, contextId]);

  // Selection state
  const selection = useTrackSelection({
    currentFilters: fullFilters,
    totalMatchingTracks: totalTracks,
    tracks,
  });

  // Reset selection on page/filter change
  useEffect(() => {
    selection.resetSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortOrder, JSON.stringify(currentFilters)]);

  // Bulk operation handlers
  const handleBulkRate = async (rating: number, overwriteExisting: boolean) => {
    const payload = selection.getSelectionPayload();
    await bulkRateMutation.mutateAsync({
      data: { ...payload, overwriteExisting, rating },
    });
    selection.clearSelection();
    onRefetch?.();
  };

  const handleBulkTag = async (tagId: string, action: "add" | "remove") => {
    const payload = selection.getSelectionPayload();
    await bulkTagMutation.mutateAsync({ data: { ...payload, action, tagId } });
    selection.clearSelection();
    onRefetch?.();
  };

  if (!enabled) {
    return (
      <>
        {children({
          isAllOnPageSelected: false,
          isSomeOnPageSelected: false,
          isTrackSelected: () => false,
          selectAllOnPage: () => {},
          toggleTrack: () => {},
        })}
      </>
    );
  }

  return (
    <>
      {children({
        isAllOnPageSelected: selection.isAllOnPageSelected,
        isSomeOnPageSelected: selection.isSomeOnPageSelected,
        isTrackSelected: selection.isTrackSelected,
        selectAllOnPage: selection.selectAllOnPage,
        toggleTrack: selection.toggleTrack,
      })}

      <BulkActionBar
        onBulkRate={ratingModalHandlers.open}
        onBulkTag={tagModalHandlers.open}
        onClearSelection={selection.clearSelection}
        onSelectAllMatching={selection.selectAllMatching}
        selectionCount={selection.selectionCount}
        selectionMode={selection.selectionMode}
        totalMatchingTracks={totalTracks}
      />

      <BulkRatingModal
        onClose={ratingModalHandlers.close}
        onConfirm={handleBulkRate}
        opened={ratingModalOpened}
        selectionCount={selection.selectionCount}
      />

      <BulkTagModal
        onClose={tagModalHandlers.close}
        onConfirm={handleBulkTag}
        opened={tagModalOpened}
        selectionCount={selection.selectionCount}
      />
    </>
  );
}
