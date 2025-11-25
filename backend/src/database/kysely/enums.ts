export const SourceType = {
  ALBUM: "ALBUM",
  ARTIST_TOP_TRACKS: "ARTIST_TOP_TRACKS",
  LIKED_SONGS: "LIKED_SONGS",
  PLAY_HISTORY: "PLAY_HISTORY",
  PLAYLIST: "PLAYLIST",
} as const;
export type SourceType = (typeof SourceType)[keyof typeof SourceType];
