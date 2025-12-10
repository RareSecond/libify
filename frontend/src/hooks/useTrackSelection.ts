import { useCallback, useMemo, useState } from "react";

import { BulkOperationFilterDto, TrackDto } from "@/data/api";

export type SelectionMode =
  | "all_matching"
  | "all_matching_except"
  | "none"
  | "page";

/** Props passed to components that need selection state for rendering */
export interface SelectionRenderProps {
  isAllOnPageSelected: boolean;
  isSomeOnPageSelected: boolean;
  isTrackSelected: (trackId: string) => boolean;
  selectAllOnPage: () => void;
  toggleTrack: (trackId: string) => void;
}

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
  // In "all_matching_except" mode, this stores excluded IDs
  // In other modes, this stores selected IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("none");

  const isTrackSelected = useCallback(
    (trackId: string) => {
      if (selectionMode === "all_matching") {
        return true;
      }
      if (selectionMode === "all_matching_except") {
        // In this mode, selectedIds contains excluded IDs
        return !selectedIds.has(trackId);
      }
      return selectedIds.has(trackId);
    },
    [selectedIds, selectionMode],
  );

  const toggleTrack = useCallback(
    (trackId: string) => {
      if (selectionMode === "all_matching") {
        // Switching from all_matching to all_matching_except
        // The toggled track becomes the first excluded ID
        setSelectedIds(new Set([trackId]));
        setSelectionMode("all_matching_except");
      } else if (selectionMode === "all_matching_except") {
        // Toggle exclusion
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(trackId)) {
            // Re-include this track (remove from exclusions)
            next.delete(trackId);
          } else {
            // Exclude this track
            next.add(trackId);
          }
          return next;
        });
      } else {
        // Normal toggle for "none" or "page" modes
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
      }
    },
    [selectionMode],
  );

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

  const selectionCount = useMemo(() => {
    if (selectionMode === "all_matching") {
      return totalMatchingTracks;
    }
    if (selectionMode === "all_matching_except") {
      // selectedIds contains excluded IDs in this mode
      return totalMatchingTracks - selectedIds.size;
    }
    return selectedIds.size;
  }, [selectionMode, selectedIds.size, totalMatchingTracks]);

  const isAllOnPageSelected = useMemo(() => {
    if (tracks.length === 0) return false;
    if (selectionMode === "all_matching") return true;
    if (selectionMode === "all_matching_except") {
      // All selected if no tracks on this page are excluded
      return tracks.every((t) => !selectedIds.has(t.id));
    }
    return tracks.every((t) => selectedIds.has(t.id));
  }, [tracks, selectedIds, selectionMode]);

  const isSomeOnPageSelected = useMemo(() => {
    if (tracks.length === 0) return false;
    if (selectionMode === "all_matching") return false; // All are selected
    if (selectionMode === "all_matching_except") {
      // Some selected if some (but not all) tracks are excluded
      const someExcluded = tracks.some((t) => selectedIds.has(t.id));
      const allExcluded = tracks.every((t) => selectedIds.has(t.id));
      return someExcluded && !allExcluded;
    }
    const someSelected = tracks.some((t) => selectedIds.has(t.id));
    return someSelected && !isAllOnPageSelected;
  }, [tracks, selectedIds, selectionMode, isAllOnPageSelected]);

  // For API requests - returns either filter or trackIds with exclusions
  const getSelectionPayload = useCallback(():
    | { excludeTrackIds?: string[]; filter: BulkOperationFilterDto }
    | { trackIds: string[] } => {
    if (selectionMode === "all_matching") {
      return { filter: currentFilters };
    }
    if (selectionMode === "all_matching_except") {
      // Filter-based with exclusions
      return {
        excludeTrackIds: Array.from(selectedIds),
        filter: currentFilters,
      };
    }
    return { trackIds: Array.from(selectedIds) };
  }, [selectionMode, selectedIds, currentFilters]);

  const hasSelection =
    selectedIds.size > 0 ||
    selectionMode === "all_matching" ||
    selectionMode === "all_matching_except";

  return {
    clearSelection,
    getSelectionPayload,
    hasSelection,
    isAllOnPageSelected,
    isSomeOnPageSelected,
    isTrackSelected,
    // Alias for clearSelection - kept for API compatibility
    resetSelection: clearSelection,
    selectAllMatching,
    selectAllOnPage,
    selectedIds,
    selectionCount,
    selectionMode,
    toggleTrack,
  };
}
