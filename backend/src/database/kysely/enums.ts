export const SourceType = {
  ALBUM: "ALBUM",
  ARTIST_TOP_TRACKS: "ARTIST_TOP_TRACKS",
  LIKED_SONGS: "LIKED_SONGS",
  PLAYLIST: "PLAYLIST",
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];
