import { z } from "zod";

/**
 * Valid sort fields for track tables.
 * Used across all route schemas to ensure consistency.
 */
export const TRACK_SORT_FIELDS = [
  "title",
  "artist",
  "album",
  "addedAt",
  "lastPlayedAt",
  "totalPlayCount",
  "rating",
  "duration",
  // Audio features
  "tempo",
  "energy",
  "danceability",
  "valence",
  "acousticness",
  "instrumentalness",
  "speechiness",
  "liveness",
] as const;

export type TrackSortField = (typeof TRACK_SORT_FIELDS)[number];

/**
 * Zod schema for track sortBy field validation.
 * Use in route search schemas.
 */
export const trackSortBySchema = z.enum(TRACK_SORT_FIELDS);

/**
 * Zod schema for sort order validation.
 */
export const sortOrderSchema = z.enum(["asc", "desc"]);
