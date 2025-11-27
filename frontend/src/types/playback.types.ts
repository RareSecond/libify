export interface PlayContext {
  clickedIndex?: number;
  contextId?: string;
  contextType?:
    | "album"
    | "artist"
    | "library"
    | "play_history"
    | "playlist"
    | "recently_played"
    | "smart_playlist"
    | "top_tracks";
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  shuffle?: boolean;
  sortBy?: string;
  sortOrder?: string;
  unratedOnly?: boolean;
}
