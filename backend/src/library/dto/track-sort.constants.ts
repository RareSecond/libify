/**
 * Valid sort fields for track queries.
 * Shared across all track-related query DTOs to ensure consistency.
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
  "releaseDate",
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
