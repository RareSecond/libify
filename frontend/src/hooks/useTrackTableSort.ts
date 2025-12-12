/**
 * Utility function to compute new sort state when a column header is clicked.
 * Returns an object with the new sortBy and sortOrder values to spread into URL params.
 */
export function getNextSortState<T extends string>(
  columnId: string,
  currentSortBy: T | undefined,
  currentSortOrder: "asc" | "desc",
): { sortBy: T; sortOrder: "asc" | "desc" } {
  if (columnId === currentSortBy) {
    return {
      sortBy: columnId as T,
      sortOrder: currentSortOrder === "asc" ? "desc" : "asc",
    };
  }
  return { sortBy: columnId as T, sortOrder: "desc" };
}
