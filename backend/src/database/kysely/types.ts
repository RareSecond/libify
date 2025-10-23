import type { ColumnType } from "kysely";
export type DB = {
  PlayHistory: PlayHistory;
  SmartPlaylist: SmartPlaylist;
  SpotifyAlbum: SpotifyAlbum;
  SpotifyArtist: SpotifyArtist;
  SpotifyTrack: SpotifyTrack;
  Tag: Tag;
  TrackSource: TrackSource;
  TrackTag: TrackTag;
  User: User;
  UserAlbum: UserAlbum;
  UserArtist: UserArtist;
  UserPlaylist: UserPlaylist;
  UserTrack: UserTrack;
};
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

import type { SourceType } from "./enums";

export type PlayHistory = {
  duration: null | number;
  id: string;
  playedAt: Timestamp;
  userTrackId: string;
};
export type SmartPlaylist = {
  createdAt: Generated<Timestamp>;
  criteria: unknown;
  description: null | string;
  id: string;
  isActive: Generated<boolean>;
  lastUpdated: Generated<Timestamp>;
  name: string;
  updatedAt: Timestamp;
  userId: string;
};
export type SpotifyAlbum = {
  albumType: null | string;
  artistId: string;
  id: string;
  imageUrl: null | string;
  lastUpdated: Generated<Timestamp>;
  name: string;
  releaseDate: null | Timestamp;
  spotifyId: string;
  totalTracks: null | number;
};
export type SpotifyArtist = {
  genres: string[];
  id: string;
  imageUrl: null | string;
  lastUpdated: Generated<Timestamp>;
  name: string;
  popularity: null | number;
  spotifyId: string;
};
export type SpotifyTrack = {
  albumId: string;
  artistId: string;
  discNumber: null | number;
  duration: number;
  explicit: Generated<boolean>;
  id: string;
  lastUpdated: Generated<Timestamp>;
  popularity: null | number;
  previewUrl: null | string;
  spotifyId: string;
  title: string;
  trackNumber: null | number;
};
export type Tag = {
  color: null | string;
  createdAt: Generated<Timestamp>;
  id: string;
  name: string;
  userId: string;
};
export type Timestamp = ColumnType<Date, Date | string, Date | string>;
export type TrackSource = {
  createdAt: Generated<Timestamp>;
  id: string;
  sourceId: null | string;
  sourceName: null | string;
  sourceType: SourceType;
  userTrackId: string;
};
export type TrackTag = {
  createdAt: Generated<Timestamp>;
  tagId: string;
  userTrackId: string;
};
export type User = {
  createdAt: Generated<Timestamp>;
  email: string;
  id: string;
  lastPlaySyncedAt: null | Timestamp;
  name: null | string;
  provider: string;
  providerId: string;
  spotifyAccessToken: null | string;
  spotifyId: null | string;
  spotifyRefreshToken: null | string;
  tokenExpiresAt: null | Timestamp;
  updatedAt: Timestamp;
};
export type UserAlbum = {
  albumId: string;
  avgRating: null | number;
  firstAddedAt: Generated<Timestamp>;
  id: string;
  lastPlayedAt: null | Timestamp;
  ratedTrackCount: Generated<number>;
  totalDuration: Generated<number>;
  totalPlayCount: Generated<number>;
  trackCount: Generated<number>;
  updatedAt: Timestamp;
  userId: string;
};
export type UserArtist = {
  albumCount: Generated<number>;
  artistId: string;
  avgRating: null | number;
  firstAddedAt: Generated<Timestamp>;
  id: string;
  lastPlayedAt: null | Timestamp;
  ratedTrackCount: Generated<number>;
  totalDuration: Generated<number>;
  totalPlayCount: Generated<number>;
  trackCount: Generated<number>;
  updatedAt: Timestamp;
  userId: string;
};
export type UserPlaylist = {
  collaborative: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  description: null | string;
  id: string;
  lastSyncedAt: Generated<Timestamp>;
  name: string;
  ownerId: string;
  ownerName: null | string;
  public: Generated<boolean>;
  snapshotId: string;
  spotifyId: string;
  totalTracks: number;
  updatedAt: Timestamp;
  userId: string;
};
export type UserTrack = {
  addedAt: Generated<Timestamp>;
  id: string;
  lastPlayedAt: null | Timestamp;
  ratedAt: null | Timestamp;
  rating: null | number;
  spotifyTrackId: string;
  totalPlayCount: Generated<number>;
  userId: string;
};
