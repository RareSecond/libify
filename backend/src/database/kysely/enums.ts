export const SourceType = {
  LIKED_SONGS: "LIKED_SONGS",
  PLAYLIST: "PLAYLIST",
  ALBUM: "ALBUM",
  ARTIST_TOP_TRACKS: "ARTIST_TOP_TRACKS",
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];
