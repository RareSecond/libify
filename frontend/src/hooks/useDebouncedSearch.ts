import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";

interface UseDebouncedSearchOptions {
  delay?: number;
  onDebouncedChange?: (value: string) => void;
}

export function useDebouncedSearch(
  urlSearch: string,
  options: UseDebouncedSearchOptions = {},
) {
  const { delay = 300, onDebouncedChange } = options;

  // Local state for search input
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [debouncedSearch] = useDebouncedValue(localSearch, delay);

  // Sync local search with URL search when URL changes (e.g., back button)
  useEffect(() => {
    setLocalSearch(urlSearch);
  }, [urlSearch]);

  // Call callback when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== urlSearch && onDebouncedChange) {
      onDebouncedChange(debouncedSearch);
    }
  }, [debouncedSearch, urlSearch, onDebouncedChange]);

  return {
    debouncedSearch,
    localSearch,
    setLocalSearch,
  };
}
