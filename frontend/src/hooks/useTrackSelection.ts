import { useCallback, useMemo, useState } from "react";

import { BulkOperationFilterDto, TrackDto } from "@/data/api";

export type SelectionMode = "all_matching" | "none" | "page";

export type UseTrackSelectionReturn = ReturnType<typeof useTrackSelection>;

interface UseTrackSelectionOptions {
  currentFilters: BulkOperationFilterDto;
  totalMatchingTracks: number;
  tracks: TrackDto[];
}

export function useTrackSelection({
  currentFilters,
  totalMatchingTracks,
  tracks,
}: UseTrackSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("none");

  const isTrackSelected = useCallback(
    (trackId: string) => {
      if (selectionMode === "all_matching") {
        return true;
      }
      return selectedIds.has(trackId);
    },
    [selectedIds, selectionMode],
  );

  const toggleTrack = useCallback((trackId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
    setSelectionMode("none");
  }, []);

  const selectAllOnPage = useCallback(() => {
    // If all on page are already selected, deselect all
    const allSelected =
      tracks.length > 0 && tracks.every((t) => selectedIds.has(t.id));
    if (allSelected) {
      setSelectedIds(new Set());
      setSelectionMode("none");
    } else {
      setSelectedIds(new Set(tracks.map((t) => t.id)));
      setSelectionMode("page");
    }
  }, [tracks, selectedIds]);

  const selectAllMatching = useCallback(() => {
    // Store visible track IDs but mark mode as all_matching
    setSelectedIds(new Set(tracks.map((t) => t.id)));
    setSelectionMode("all_matching");
  }, [tracks]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode("none");
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode("none");
  }, []);

  const selectionCount = useMemo(() => {
    if (selectionMode === "all_matching") {
      return totalMatchingTracks;
    }
    return selectedIds.size;
  }, [selectionMode, selectedIds.size, totalMatchingTracks]);

  const isAllOnPageSelected = useMemo(() => {
    if (tracks.length === 0) return false;
    return tracks.every((t) => selectedIds.has(t.id));
  }, [tracks, selectedIds]);

  const isSomeOnPageSelected = useMemo(() => {
    if (tracks.length === 0) return false;
    const someSelected = tracks.some((t) => selectedIds.has(t.id));
    return someSelected && !isAllOnPageSelected;
  }, [tracks, selectedIds, isAllOnPageSelected]);

  // For API requests - returns either filter or trackIds
  const getSelectionPayload = useCallback(():
    | { filter: BulkOperationFilterDto }
    | { trackIds: string[] } => {
    if (selectionMode === "all_matching") {
      return { filter: currentFilters };
    }
    return { trackIds: Array.from(selectedIds) };
  }, [selectionMode, selectedIds, currentFilters]);

  const hasSelection = selectedIds.size > 0 || selectionMode === "all_matching";

  return {
    clearSelection,
    getSelectionPayload,
    hasSelection,
    isAllOnPageSelected,
    isSomeOnPageSelected,
    isTrackSelected,
    resetSelection,
    selectAllMatching,
    selectAllOnPage,
    selectedIds,
    selectionCount,
    selectionMode,
    toggleTrack,
  };
}
