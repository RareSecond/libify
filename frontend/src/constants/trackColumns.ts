import { VisibilityState } from "@tanstack/react-table";

/**
 * Track column configuration.
 * Single source of truth for all column metadata.
 */
export interface TrackColumnConfig {
  /** Column category for grouping in UI */
  category: "audio_feature" | "core" | "metadata";
  /** Whether visible by default */
  defaultVisible: boolean;
  /** Column identifier - matches TanStack table column id */
  id: string;
  /** Human-readable label for display */
  label: string;
  /** Whether column is required and cannot be hidden */
  required?: boolean;
  /** Whether column can be sorted */
  sortable: boolean;
}

/**
 * All track column configurations.
 * Adding a new column requires only adding an entry here.
 */
export const TRACK_COLUMN_CONFIGS: TrackColumnConfig[] = [
  // Core columns - always visible, essential for track identification
  {
    category: "core",
    defaultVisible: true,
    id: "albumArt",
    label: "Album Art",
    required: true,
    sortable: false,
  },
  {
    category: "core",
    defaultVisible: true,
    id: "title",
    label: "Title",
    required: true,
    sortable: true,
  },
  {
    category: "core",
    defaultVisible: true,
    id: "artist",
    label: "Artist",
    required: false,
    sortable: true,
  },
  {
    category: "core",
    defaultVisible: true,
    id: "album",
    label: "Album",
    required: false,
    sortable: true,
  },
  {
    category: "core",
    defaultVisible: true,
    id: "duration",
    label: "Duration",
    required: false,
    sortable: true,
  },

  // Metadata columns - user activity and track info
  {
    category: "metadata",
    defaultVisible: true,
    id: "totalPlayCount",
    label: "Plays",
    required: false,
    sortable: true,
  },
  {
    category: "metadata",
    defaultVisible: true,
    id: "lastPlayedAt",
    label: "Last Played",
    required: false,
    sortable: true,
  },
  {
    category: "metadata",
    defaultVisible: true,
    id: "addedAt",
    label: "Added",
    required: false,
    sortable: true,
  },
  {
    category: "metadata",
    defaultVisible: true,
    id: "releaseDate",
    label: "Released",
    required: false,
    sortable: true,
  },
  {
    category: "metadata",
    defaultVisible: true,
    id: "rating",
    label: "Rating",
    required: false,
    sortable: true,
  },
  {
    category: "metadata",
    defaultVisible: true,
    id: "tags",
    label: "Tags",
    required: false,
    sortable: false,
  },
  {
    category: "metadata",
    defaultVisible: true,
    id: "sources",
    label: "Sources",
    required: false,
    sortable: false,
  },
  {
    category: "metadata",
    defaultVisible: true,
    id: "genres",
    label: "Genres",
    required: false,
    sortable: false,
  },

  // Audio feature columns - hidden by default
  {
    category: "audio_feature",
    defaultVisible: false,
    id: "tempo",
    label: "BPM",
    required: false,
    sortable: true,
  },
  {
    category: "audio_feature",
    defaultVisible: false,
    id: "energy",
    label: "Energy",
    required: false,
    sortable: true,
  },
  {
    category: "audio_feature",
    defaultVisible: false,
    id: "danceability",
    label: "Danceability",
    required: false,
    sortable: true,
  },
  {
    category: "audio_feature",
    defaultVisible: false,
    id: "valence",
    label: "Mood",
    required: false,
    sortable: true,
  },
  {
    category: "audio_feature",
    defaultVisible: false,
    id: "acousticness",
    label: "Acoustic",
    required: false,
    sortable: true,
  },
  {
    category: "audio_feature",
    defaultVisible: false,
    id: "instrumentalness",
    label: "Instrumental",
    required: false,
    sortable: true,
  },
  {
    category: "audio_feature",
    defaultVisible: false,
    id: "speechiness",
    label: "Speechiness",
    required: false,
    sortable: true,
  },
  {
    category: "audio_feature",
    defaultVisible: false,
    id: "liveness",
    label: "Liveness",
    required: false,
    sortable: true,
  },
];

/**
 * Default column order for tracks table.
 * Derived from TRACK_COLUMN_CONFIGS.
 */
export const DEFAULT_COLUMN_ORDER: string[] = TRACK_COLUMN_CONFIGS.map(
  (col) => col.id,
);

/**
 * Default column visibility state.
 * Derived from TRACK_COLUMN_CONFIGS.
 */
export const DEFAULT_COLUMN_VISIBILITY: VisibilityState =
  TRACK_COLUMN_CONFIGS.reduce(
    (acc, col) => {
      acc[col.id] = col.defaultVisible;
      return acc;
    },
    {} as Record<string, boolean>,
  );

/**
 * Column labels map for display.
 * Derived from TRACK_COLUMN_CONFIGS.
 */
export const COLUMN_LABELS: Record<string, string> =
  TRACK_COLUMN_CONFIGS.reduce(
    (acc, col) => {
      acc[col.id] = col.label;
      return acc;
    },
    {} as Record<string, string>,
  );

/**
 * Required columns that cannot be hidden.
 * Derived from TRACK_COLUMN_CONFIGS.
 */
export const REQUIRED_COLUMNS: string[] = TRACK_COLUMN_CONFIGS.filter(
  (col) => col.required,
).map((col) => col.id);
