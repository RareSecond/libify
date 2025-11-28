import { ColumnSizingState, Updater } from "@tanstack/react-table";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tracks-table-column-sizing";

export function useColumnSizing() {
  const [columnSizing, setColumnSizingState] = useState<ColumnSizingState>(
    () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Silently fallback to empty state
      }
      return {};
    },
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnSizing));
    } catch {
      // Unable to save to localStorage
    }
  }, [columnSizing]);

  // Handle TanStack Table's Updater type (can be value or function)
  const setColumnSizing = useCallback(
    (updaterOrValue: Updater<ColumnSizingState>) => {
      setColumnSizingState((prev) =>
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue,
      );
    },
    [],
  );

  const resetColumnSizing = useCallback(() => {
    setColumnSizingState({});
  }, []);

  return { columnSizing, resetColumnSizing, setColumnSizing };
}
