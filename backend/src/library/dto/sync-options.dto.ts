import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Options for controlling what gets synced during a library sync operation.
 * All options default to their most common use case (sync everything, don't force refresh).
 */
export class SyncOptionsDto {
  @ApiProperty({
    default: false,
    description:
      'Force refresh all playlists, ignoring snapshot-based change detection. ' +
      'By default, playlists are only synced if their snapshot ID has changed since the last sync. ' +
      'Set to true to re-sync all playlists regardless of changes.',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  forceRefreshPlaylists?: boolean = false;

  @ApiProperty({
    default: true,
    description:
      'Include saved albums in sync. When false, only liked tracks and playlists will be synced.',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  syncAlbums?: boolean = true;

  @ApiProperty({
    default: true,
    description:
      'Include liked tracks (saved songs) in sync. When false, only albums and playlists will be synced.',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  syncLikedTracks?: boolean = true;

  @ApiProperty({
    default: true,
    description:
      'Include playlists in sync. When false, only liked tracks and albums will be synced.',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  syncPlaylists?: boolean = true;
}
