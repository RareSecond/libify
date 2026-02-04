import { SourceType } from "@prisma/client";
import { plainToInstance } from "class-transformer";

import { TrackDto } from "../dto/track.dto";

/**
 * Raw track data structure from Kysely queries.
 * Uses flattened/aliased fields from SQL joins.
 */
export interface KyselyTrackData {
  acousticness: null | number;
  addedAt: Date;
  albumId: string;
  albumImageUrl: null | string;
  albumName: string;
  artistGenres: string[];
  artistId: string;
  artistName: string;
  danceability: null | number;
  duration: number;
  energy: null | number;
  id: string;
  instrumentalness: null | number;
  lastPlayedAt: Date | null;
  liveness: null | number;
  ratedAt: Date | null;
  rating: null | number;
  releaseDate: Date | null;
  sources: Array<{
    createdAt: Date;
    id: string;
    sourceId: null | string;
    sourceName: null | string;
    sourceType: string;
  }>;
  speechiness: null | number;
  spotifyId: string;
  tags: Array<{ color: null | string; id: string; name: string }>;
  tempo: null | number;
  title: string;
  totalPlayCount: number;
  valence: null | number;
}

/**
 * Raw track data structure from Prisma queries with includes.
 * Uses nested relations structure.
 */
export interface PrismaTrackData {
  addedAt: Date;
  id: string;
  lastPlayedAt: Date | null;
  ratedAt: Date | null;
  rating: null | number;
  sources: Array<{
    createdAt: Date;
    id: string;
    sourceId: null | string;
    sourceName: null | string;
    sourceType: SourceType;
  }>;
  spotifyTrack: {
    acousticness: null | number;
    album: null | {
      imageUrl: null | string;
      name: string;
      releaseDate: Date | null;
    };
    albumId: string;
    artist: { name: string };
    artistId: string;
    danceability: null | number;
    duration: number;
    energy: null | number;
    genres: Array<{ genre: { displayName: string } }>;
    instrumentalness: null | number;
    liveness: null | number;
    speechiness: null | number;
    spotifyId: string;
    tempo: null | number;
    title: string;
    valence: null | number;
  };
  tags: Array<{ tag: { color: null | string; id: string; name: string } }>;
  totalPlayCount: number;
}

/**
 * Maps an array of Kysely query results to TrackDto array.
 */
export function mapKyselyTracksToDto(tracks: KyselyTrackData[]): TrackDto[] {
  return tracks.map(mapKyselyTrackToDto);
}

/**
 * Maps a single Kysely query result to a TrackDto.
 * Kysely results have flattened/aliased fields from SQL joins.
 */
export function mapKyselyTrackToDto(track: KyselyTrackData): TrackDto {
  const dto = {
    acousticness: track.acousticness ?? undefined,
    addedAt: track.addedAt,
    album: track.albumName,
    albumArt: track.albumImageUrl,
    albumId: track.albumId,
    artist: track.artistName,
    artistGenres: track.artistGenres,
    artistId: track.artistId,
    danceability: track.danceability ?? undefined,
    duration: track.duration,
    energy: track.energy ?? undefined,
    id: track.id,
    instrumentalness: track.instrumentalness ?? undefined,
    lastPlayedAt: track.lastPlayedAt,
    liveness: track.liveness ?? undefined,
    ratedAt: track.ratedAt,
    rating: track.rating,
    releaseDate: track.releaseDate,
    sources: track.sources,
    speechiness: track.speechiness ?? undefined,
    spotifyId: track.spotifyId,
    tags: track.tags,
    tempo: track.tempo ?? undefined,
    title: track.title,
    totalPlayCount: track.totalPlayCount,
    valence: track.valence ?? undefined,
  };

  return plainToInstance(TrackDto, dto, { excludeExtraneousValues: true });
}

/**
 * Maps an array of Prisma query results to TrackDto array.
 */
export function mapPrismaTracksToDto(tracks: PrismaTrackData[]): TrackDto[] {
  return tracks.map(mapPrismaTrackToDto);
}

/**
 * Maps a single Prisma query result to a TrackDto.
 * Prisma results have nested relation structures.
 */
export function mapPrismaTrackToDto(track: PrismaTrackData): TrackDto {
  const dto = {
    acousticness: track.spotifyTrack.acousticness ?? undefined,
    addedAt: track.addedAt,
    album: track.spotifyTrack.album?.name || null,
    albumArt: track.spotifyTrack.album?.imageUrl || null,
    albumId: track.spotifyTrack.albumId,
    artist: track.spotifyTrack.artist.name,
    artistGenres: track.spotifyTrack.genres.map((g) => g.genre.displayName),
    artistId: track.spotifyTrack.artistId,
    danceability: track.spotifyTrack.danceability ?? undefined,
    duration: track.spotifyTrack.duration,
    energy: track.spotifyTrack.energy ?? undefined,
    id: track.id,
    instrumentalness: track.spotifyTrack.instrumentalness ?? undefined,
    lastPlayedAt: track.lastPlayedAt,
    liveness: track.spotifyTrack.liveness ?? undefined,
    ratedAt: track.ratedAt,
    rating: track.rating,
    releaseDate: track.spotifyTrack.album?.releaseDate || null,
    sources: track.sources.map((s) => ({
      createdAt: s.createdAt,
      id: s.id,
      sourceId: s.sourceId,
      sourceName: s.sourceName,
      sourceType: s.sourceType,
    })),
    speechiness: track.spotifyTrack.speechiness ?? undefined,
    spotifyId: track.spotifyTrack.spotifyId,
    tags: track.tags.map((t) => ({
      color: t.tag.color,
      id: t.tag.id,
      name: t.tag.name,
    })),
    tempo: track.spotifyTrack.tempo ?? undefined,
    title: track.spotifyTrack.title,
    totalPlayCount: track.totalPlayCount,
    valence: track.spotifyTrack.valence ?? undefined,
  };

  return plainToInstance(TrackDto, dto, { excludeExtraneousValues: true });
}
