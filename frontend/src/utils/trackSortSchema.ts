import { z } from "zod";

import {
  LibraryControllerGetTracksSortBy,
  LibraryControllerGetTracksSortOrder,
} from "../data/api";

/**
 * Re-export the sort field type from the generated API.
 * This ensures type compatibility with API hooks.
 */
export type TrackSortField = LibraryControllerGetTracksSortBy;

/**
 * Valid sort fields for track tables.
 * Derived from the generated API types to ensure consistency with backend.
 */
const TRACK_SORT_FIELDS_VALUES = Object.values(
  LibraryControllerGetTracksSortBy,
);

/**
 * Zod schema for track sortBy field validation.
 * Derived from the generated API types.
 */
export const trackSortBySchema = z.enum(
  TRACK_SORT_FIELDS_VALUES as [
    LibraryControllerGetTracksSortBy,
    ...LibraryControllerGetTracksSortBy[],
  ],
);

/**
 * Zod schema for sort order validation.
 * Derived from the generated API types.
 */
export const sortOrderSchema = z.enum(
  Object.values(LibraryControllerGetTracksSortOrder) as [
    LibraryControllerGetTracksSortOrder,
    ...LibraryControllerGetTracksSortOrder[],
  ],
);
