import type { ColumnType } from "kysely";
export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { SourceType } from "./enums";

export type Genre = {
  id: string;
  name: string;
  displayName: string;
  createdAt: Generated<Timestamp>;
};
export type PlayHistory = {
  id: string;
  userTrackId: string;
  playedAt: Timestamp;
  duration: number | null;
};
export type SmartPlaylist = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  criteria: unknown;
  isActive: Generated<boolean>;
  spotifyPlaylistId: string | null;
  lastSyncedAt: Timestamp | null;
  trackIdsHash: string | null;
  autoSync: Generated<boolean>;
  lastUpdated: Generated<Timestamp>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type SpotifyAlbum = {
  id: string;
  spotifyId: string;
  name: string;
  artistId: string;
  imageUrl: string | null;
  releaseDate: Timestamp | null;
  totalTracks: number | null;
  albumType: string | null;
  lastUpdated: Generated<Timestamp>;
};
export type SpotifyArtist = {
  id: string;
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  popularity: number | null;
  lastUpdated: Generated<Timestamp>;
};
export type SpotifyTrack = {
  id: string;
  spotifyId: string;
  isrc: string | null;
  title: string;
  artistId: string;
  albumId: string;
  trackNumber: number | null;
  discNumber: number | null;
  duration: number;
  explicit: Generated<boolean>;
  popularity: number | null;
  previewUrl: string | null;
  lastUpdated: Generated<Timestamp>;
  tempo: number | null;
  danceability: number | null;
  energy: number | null;
  valence: number | null;
  acousticness: number | null;
  instrumentalness: number | null;
  speechiness: number | null;
  liveness: number | null;
  loudness: number | null;
  key: number | null;
  mode: number | null;
  timeSignature: number | null;
  audioFeaturesUpdatedAt: Timestamp | null;
  genresUpdatedAt: Timestamp | null;
};
export type Tag = {
  id: string;
  name: string;
  color: string | null;
  userId: string;
  createdAt: Generated<Timestamp>;
};
export type TrackGenre = {
  trackId: string;
  genreId: string;
  weight: number;
  createdAt: Generated<Timestamp>;
};
export type TrackSource = {
  id: string;
  userTrackId: string;
  sourceType: SourceType;
  sourceName: string | null;
  sourceId: string | null;
  createdAt: Generated<Timestamp>;
};
export type TrackTag = {
  userTrackId: string;
  tagId: string;
  createdAt: Generated<Timestamp>;
};
export type User = {
  id: string;
  email: string;
  name: string | null;
  provider: string;
  providerId: string;
  spotifyId: string | null;
  spotifyAccessToken: string | null;
  spotifyRefreshToken: string | null;
  tokenExpiresAt: Timestamp | null;
  lastPlaySyncedAt: Timestamp | null;
  hasCompletedOnboarding: Generated<boolean>;
  isWhitelisted: Generated<boolean>;
  isAdmin: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type UserAlbum = {
  id: string;
  userId: string;
  albumId: string;
  trackCount: Generated<number>;
  totalDuration: Generated<number>;
  totalPlayCount: Generated<number>;
  avgRating: number | null;
  ratedTrackCount: Generated<number>;
  lastPlayedAt: Timestamp | null;
  firstAddedAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type UserArtist = {
  id: string;
  userId: string;
  artistId: string;
  trackCount: Generated<number>;
  albumCount: Generated<number>;
  totalDuration: Generated<number>;
  totalPlayCount: Generated<number>;
  avgRating: number | null;
  ratedTrackCount: Generated<number>;
  lastPlayedAt: Timestamp | null;
  firstAddedAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type UserPlaylist = {
  id: string;
  userId: string;
  spotifyId: string;
  name: string;
  description: string | null;
  snapshotId: string;
  totalTracks: number;
  ownerId: string;
  ownerName: string | null;
  collaborative: Generated<boolean>;
  public: Generated<boolean>;
  imageUrl: string | null;
  totalDuration: Generated<number>;
  totalPlayCount: Generated<number>;
  avgRating: number | null;
  ratedTrackCount: Generated<number>;
  lastPlayedAt: Timestamp | null;
  firstAddedAt: Generated<Timestamp>;
  lastSyncedAt: Generated<Timestamp>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type UserTrack = {
  id: string;
  userId: string;
  spotifyTrackId: string;
  addedAt: Generated<Timestamp>;
  addedToLibrary: Generated<boolean>;
  lastPlayedAt: Timestamp | null;
  totalPlayCount: Generated<number>;
  rating: number | null;
  ratedAt: Timestamp | null;
};
export type DB = {
  Genre: Genre;
  PlayHistory: PlayHistory;
  SmartPlaylist: SmartPlaylist;
  SpotifyAlbum: SpotifyAlbum;
  SpotifyArtist: SpotifyArtist;
  SpotifyTrack: SpotifyTrack;
  Tag: Tag;
  TrackGenre: TrackGenre;
  TrackSource: TrackSource;
  TrackTag: TrackTag;
  User: User;
  UserAlbum: UserAlbum;
  UserArtist: UserArtist;
  UserPlaylist: UserPlaylist;
  UserTrack: UserTrack;
};
