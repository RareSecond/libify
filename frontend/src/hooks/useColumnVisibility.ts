import { Updater, VisibilityState } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";

import { DEFAULT_COLUMN_VISIBILITY } from "../constants/trackColumns";

const STORAGE_KEY = "tracks-table-column-visibility";

export function useColumnVisibility() {
  const [columnVisibility, setColumnVisibilityState] =
    useState<VisibilityState>(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with defaults to handle new columns
          return { ...DEFAULT_COLUMN_VISIBILITY, ...parsed };
        }
      } catch {
        // Silently fallback to default visibility
      }
      return DEFAULT_COLUMN_VISIBILITY;
    });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
    } catch {
      // Unable to save to localStorage
    }
  }, [columnVisibility]);

  // Handle TanStack Table's Updater type (can be value or function)
  const setColumnVisibility = useCallback(
    (updaterOrValue: Updater<VisibilityState>) => {
      setColumnVisibilityState((prev) =>
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue,
      );
    },
    [],
  );

  const resetColumnVisibility = useCallback(() => {
    setColumnVisibilityState(DEFAULT_COLUMN_VISIBILITY);
  }, []);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibilityState((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  return {
    columnVisibility,
    resetColumnVisibility,
    setColumnVisibility,
    toggleColumnVisibility,
  };
}
