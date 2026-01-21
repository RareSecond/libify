export interface PlayContext {
  clickedIndex?: number;
  contextId?: string;
  contextType?:
    | "album"
    | "artist"
    | "library"
    | "playlist"
    | "recently_played"
    | "smart_playlist"
    | "top_tracks"
    | "track";
  genres?: string[];
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  shuffle?: boolean;
  sortBy?: string;
  sortOrder?: string;
  unratedOnly?: boolean;
}
