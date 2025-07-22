import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "tracks-table-column-order";

export function useColumnOrder(defaultOrder: string[]) {
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that all default columns are present
        const hasAllColumns = defaultOrder.every((col) => parsed.includes(col));
        const hasOnlyValidColumns = parsed.every((col: string) =>
          defaultOrder.includes(col),
        );

        if (hasAllColumns && hasOnlyValidColumns) {
          return parsed;
        }
      }
    } catch {
      // Silently fallback to default order
    }
    return defaultOrder;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnOrder));
    } catch {
      // Unable to save to localStorage
    }
  }, [columnOrder]);

  const resetColumnOrder = useCallback(() => {
    setColumnOrder(defaultOrder);
  }, [defaultOrder]);

  return { columnOrder, resetColumnOrder, setColumnOrder };
}
