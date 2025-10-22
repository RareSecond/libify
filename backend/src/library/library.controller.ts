import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';

import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlbumTracksResponseDto } from './dto/album-tracks.dto';
import { PaginatedAlbumsDto } from './dto/album.dto';
import { ArtistTracksResponseDto } from './dto/artist-tracks.dto';
import { PaginatedArtistsDto } from './dto/artist.dto';
import { GetAlbumsQueryDto } from './dto/get-albums-query.dto';
import { GetArtistsQueryDto } from './dto/get-artists-query.dto';
import { UpdateRatingDto } from './dto/rating.dto';
import {
  SyncItemCountsDto,
  SyncProgressDto,
} from './dto/sync-progress-base.dto';
import { SyncJobResponseDto, SyncJobStatusDto } from './dto/sync-progress.dto';
import { SyncStatusDto } from './dto/sync-result.dto';
import {
  AddTagToTrackDto,
  CreateTagDto,
  TagResponseDto,
  UpdateTagDto,
} from './dto/tag.dto';
import { GetTracksQueryDto, PaginatedTracksDto } from './dto/track.dto';
import { LibrarySyncService } from './library-sync.service';
import { SpotifyService } from './spotify.service';
import { TagService } from './tag.service';
import { TrackService } from './track.service';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiBearerAuth()
@ApiTags('library')
@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  private readonly logger = new Logger(LibraryController.name);

  constructor(
    private librarySyncService: LibrarySyncService,
    private authService: AuthService,
    private trackService: TrackService,
    private spotifyService: SpotifyService,
    private tagService: TagService,
    @InjectQueue('sync') private syncQueue: Queue,
  ) {}

  @ApiOperation({ summary: 'Add a tag to a track' })
  @ApiResponse({ description: 'Tag added to track', status: 200 })
  @ApiResponse({ description: 'Track or tag not found', status: 404 })
  @Post('tracks/:trackId/tags')
  async addTagToTrack(
    @Req() req: AuthenticatedRequest,
    @Param('trackId') trackId: string,
    @Body() addTagDto: AddTagToTrackDto,
  ): Promise<{ message: string }> {
    await this.tagService.addTagToTrack(req.user.id, trackId, addTagDto.tagId);
    return { message: 'Tag added to track' };
  }

  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    description: 'Tag created',
    status: 201,
    type: TagResponseDto,
  })
  @Post('tags')
  async createTag(
    @Req() req: AuthenticatedRequest,
    @Body() createTagDto: CreateTagDto,
  ): Promise<TagResponseDto> {
    return this.tagService.createTag(req.user.id, createTagDto);
  }

  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ description: 'Tag deleted', status: 204 })
  @ApiResponse({ description: 'Tag not found', status: 404 })
  @Delete('tags/:tagId')
  async deleteTag(
    @Req() req: AuthenticatedRequest,
    @Param('tagId') tagId: string,
  ): Promise<void> {
    await this.tagService.deleteTag(req.user.id, tagId);
  }

  @ApiOperation({ summary: 'Get all albums in user library' })
  @ApiResponse({
    description: 'Paginated list of albums',
    status: 200,
    type: PaginatedAlbumsDto,
  })
  @Get('albums')
  async getAlbums(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetAlbumsQueryDto,
  ): Promise<PaginatedAlbumsDto> {
    // Manually handle genres[] parameter
    let genres: string[] = [];
    if (req.query['genres[]']) {
      const genresParam = req.query['genres[]'];
      if (Array.isArray(genresParam)) {
        genres = genresParam as string[];
      } else if (typeof genresParam === 'string') {
        genres = [genresParam];
      }
    } else if (query.genres) {
      genres = query.genres;
    }

    return this.trackService.getUserAlbums(req.user.id, {
      genres,
      page: query.page || 1,
      pageSize: query.pageSize || 24,
      search: query.search,
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder || 'asc',
    });
  }

  @ApiOperation({ summary: 'Get tracks from a specific album' })
  @ApiResponse({
    description: 'List of tracks from the album',
    status: 200,
    type: AlbumTracksResponseDto,
  })
  @Get('albums/:artist/:album/tracks')
  async getAlbumTracks(
    @Req() req: AuthenticatedRequest,
    @Param('artist') artist: string,
    @Param('album') album: string,
  ): Promise<AlbumTracksResponseDto> {
    return this.trackService.getAlbumTracks(
      req.user.id,
      decodeURIComponent(artist),
      decodeURIComponent(album),
    );
  }

  @ApiOperation({ summary: 'Get all artists in user library' })
  @ApiResponse({
    description: 'Paginated list of artists',
    status: 200,
    type: PaginatedArtistsDto,
  })
  @Get('artists')
  async getArtists(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetArtistsQueryDto,
  ): Promise<PaginatedArtistsDto> {
    // Manually handle genres[] parameter
    let genres: string[] = [];
    if (req.query['genres[]']) {
      const genresParam = req.query['genres[]'];
      if (Array.isArray(genresParam)) {
        genres = genresParam as string[];
      } else if (typeof genresParam === 'string') {
        genres = [genresParam];
      }
    } else if (query.genres) {
      genres = query.genres;
    }

    return this.trackService.getUserArtists(req.user.id, {
      genres,
      page: query.page || 1,
      pageSize: query.pageSize || 24,
      search: query.search,
      sortBy: query.sortBy || 'name',
      sortOrder: query.sortOrder || 'asc',
    });
  }

  @ApiOperation({ summary: 'Get tracks from a specific artist' })
  @ApiResponse({
    description: 'List of tracks from the artist',
    status: 200,
    type: ArtistTracksResponseDto,
  })
  @Get('artists/:artist/tracks')
  async getArtistTracks(
    @Req() req: AuthenticatedRequest,
    @Param('artist') artist: string,
  ): Promise<ArtistTracksResponseDto> {
    return this.trackService.getArtistTracks(
      req.user.id,
      decodeURIComponent(artist),
    );
  }

  @ApiOperation({ summary: 'Get all unique genres in user library' })
  @ApiResponse({
    description: 'List of unique genres',
    status: 200,
    type: [String],
  })
  @Get('genres')
  async getGenres(@Req() req: AuthenticatedRequest): Promise<string[]> {
    return this.trackService.getUserGenres(req.user.id);
  }

  // Tag management endpoints

  @ApiOperation({
    summary: 'Pre-count items to be synced (tracks, albums, playlists)',
  })
  @ApiResponse({
    description: 'Item counts retrieved successfully',
    status: 200,
    type: SyncItemCountsDto,
  })
  @ApiResponse({ description: 'Unauthorized', status: 401 })
  @Get('sync/count')
  async getSyncItemCounts(
    @Req() req: AuthenticatedRequest,
  ): Promise<SyncItemCountsDto> {
    try {
      const accessToken = await this.authService.getSpotifyAccessToken(
        req.user.id,
      );
      if (!accessToken) {
        throw new HttpException(
          'Spotify access token not found. Please re-authenticate.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const counts = await this.librarySyncService.countSyncItems(
        req.user.id,
        accessToken,
      );

      return counts;
    } catch (error) {
      this.logger.error('Failed to count sync items', error);
      throw new HttpException(
        'Failed to count sync items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get library sync status' })
  @ApiResponse({
    description: 'Sync status retrieved',
    status: 200,
    type: SyncStatusDto,
  })
  @Get('sync/status')
  async getSyncLibraryStatus(
    @Req() req: AuthenticatedRequest,
  ): Promise<SyncStatusDto> {
    const status = await this.librarySyncService.getSyncStatus(req.user.id);
    return plainToInstance(SyncStatusDto, status, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Get sync job status by job ID' })
  @ApiResponse({
    description: 'Sync job status',
    status: 200,
    type: SyncJobStatusDto,
  })
  @ApiResponse({ description: 'Job not found', status: 404 })
  @Get('sync/:jobId')
  async getSyncStatusByJobId(
    @Param('jobId') jobId: string,
  ): Promise<SyncJobStatusDto> {
    const job = await this.syncQueue.getJob(jobId);

    if (!job) {
      throw new HttpException('Sync job not found', HttpStatus.NOT_FOUND);
    }

    const state = await job.getState();

    return {
      completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
      createdAt: new Date(job.timestamp),
      failedReason: job.failedReason,
      jobId: job.id,
      message: `Sync job is ${state}`,
      progress: job.progress as SyncProgressDto,
      result: job.returnvalue,
      status: state as 'active' | 'completed' | 'failed' | 'queued',
    };
  }

  @ApiOperation({ summary: 'Get all user tags' })
  @ApiResponse({
    description: 'List of tags',
    status: 200,
    type: [TagResponseDto],
  })
  @Get('tags')
  async getTags(@Req() req: AuthenticatedRequest): Promise<TagResponseDto[]> {
    return this.tagService.getUserTags(req.user.id);
  }

  @ApiOperation({ summary: 'Get user tracks' })
  @ApiResponse({
    description: 'Paginated list of user tracks',
    status: 200,
    type: PaginatedTracksDto,
  })
  @Get('tracks')
  async getTracks(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetTracksQueryDto,
  ): Promise<PaginatedTracksDto> {
    // Manually handle genres[] and tagIds[] parameters
    let genres: string[] = [];
    if (req.query['genres[]']) {
      const genresParam = req.query['genres[]'];
      if (Array.isArray(genresParam)) {
        genres = genresParam as string[];
      } else if (typeof genresParam === 'string') {
        genres = [genresParam];
      }
    } else if (query.genres) {
      genres = query.genres;
    }

    let tagIds: string[] = [];
    if (req.query['tagIds[]']) {
      const tagIdsParam = req.query['tagIds[]'];
      if (Array.isArray(tagIdsParam)) {
        tagIds = tagIdsParam as string[];
      } else if (typeof tagIdsParam === 'string') {
        tagIds = [tagIdsParam];
      }
    } else if (query.tagIds) {
      tagIds = query.tagIds;
    }

    return this.trackService.getUserTracks(req.user.id, {
      ...query,
      genres,
      tagIds,
    });
  }

  @ApiOperation({ summary: 'Play a track on Spotify' })
  @ApiResponse({ description: 'Track started playing', status: 200 })
  @ApiResponse({ description: 'Unauthorized', status: 401 })
  @ApiResponse({ description: 'Bad request', status: 400 })
  @Post('tracks/:trackId/play')
  async playTrack(
    @Req() req: AuthenticatedRequest,
    @Param('trackId') trackId: string,
  ) {
    try {
      // Get the track to get the Spotify ID
      const track = await this.trackService.getTrackById(req.user.id, trackId);
      if (!track) {
        throw new HttpException('Track not found', HttpStatus.NOT_FOUND);
      }

      // Get Spotify access token
      const accessToken = await this.authService.getSpotifyAccessToken(
        req.user.id,
      );
      if (!accessToken) {
        throw new HttpException(
          'Spotify access token not found. Please re-authenticate.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Play the track
      const trackUri = `spotify:track:${track.spotifyId}`;
      await this.spotifyService.playTrack(accessToken, trackUri);

      // Record the play locally
      await this.trackService.recordPlay(req.user.id, trackId);

      // Get updated track to return current play count
      const updatedTrack = await this.trackService.getTrackById(
        req.user.id,
        trackId,
      );

      return {
        message: 'Track started playing',
        playCount: updatedTrack?.totalPlayCount || 0,
        trackId: track.id,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to play track', error);
      throw new HttpException(
        error.message || 'Failed to play track',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({
    summary: 'Record a play for statistics (without starting playback)',
  })
  @ApiResponse({ description: 'Play recorded successfully', status: 200 })
  @ApiResponse({ description: 'Track not found', status: 404 })
  @Post('tracks/:trackId/record-play')
  async recordPlay(
    @Req() req: AuthenticatedRequest,
    @Param('trackId') trackId: string,
  ) {
    try {
      // Record the play locally
      await this.trackService.recordPlay(req.user.id, trackId);

      // Get updated track to return current play count
      const updatedTrack = await this.trackService.getTrackById(
        req.user.id,
        trackId,
      );

      return {
        message: 'Play recorded successfully',
        playCount: updatedTrack?.totalPlayCount || 0,
        trackId,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Failed to record play', error);
      throw new HttpException(
        error.message || 'Failed to record play',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: 'Remove a tag from a track' })
  @ApiResponse({ description: 'Tag removed from track', status: 200 })
  @ApiResponse({ description: 'Track not found', status: 404 })
  @Delete('tracks/:trackId/tags/:tagId')
  async removeTagFromTrack(
    @Req() req: AuthenticatedRequest,
    @Param('trackId') trackId: string,
    @Param('tagId') tagId: string,
  ): Promise<{ message: string }> {
    await this.tagService.removeTagFromTrack(req.user.id, trackId, tagId);
    return { message: 'Tag removed from track' };
  }

  @ApiOperation({
    summary: 'Start library sync job (non-blocking)',
  })
  @ApiResponse({
    description: 'Sync job queued successfully',
    status: 200,
    type: SyncJobResponseDto,
  })
  @ApiResponse({ description: 'Unauthorized', status: 401 })
  @Post('sync')
  async syncLibrary(
    @Req() req: AuthenticatedRequest,
  ): Promise<SyncJobResponseDto> {
    try {
      // Add sync job to queue
      const job = await this.syncQueue.add('sync-library', {
        syncType: 'full',
        userId: req.user.id,
      });

      this.logger.log(`Sync job ${job.id} queued for user ${req.user.id}`);

      return {
        createdAt: new Date(),
        jobId: job.id,
        message: 'Library sync job queued successfully',
        status: 'queued',
      };
    } catch (error) {
      this.logger.error('Failed to queue sync job', error);
      throw new HttpException(
        'Failed to start sync',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary:
      'Start quick sync job (50 liked tracks, 10 albums, 3 playlists) - returns job ID for WebSocket progress',
  })
  @ApiResponse({
    description: 'Quick sync job queued successfully',
    status: 200,
    type: SyncJobResponseDto,
  })
  @ApiResponse({ description: 'Unauthorized', status: 401 })
  @Post('sync/recent')
  async syncRecentlyPlayed(
    @Req() req: AuthenticatedRequest,
  ): Promise<SyncJobResponseDto> {
    try {
      // Add quick sync job to queue (with progress updates for WebSocket demo)
      const job = await this.syncQueue.add('quick-sync', {
        syncType: 'quick',
        userId: req.user.id,
      });

      this.logger.log(
        `Quick sync job ${job.id} queued for user ${req.user.id}`,
      );

      return {
        createdAt: new Date(),
        jobId: job.id,
        message: 'Quick sync job queued successfully',
        status: 'queued',
      };
    } catch (error) {
      this.logger.error('Failed to queue quick sync job', error);
      throw new HttpException(
        'Failed to start quick sync',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({
    description: 'Tag updated',
    status: 200,
    type: TagResponseDto,
  })
  @ApiResponse({ description: 'Tag not found', status: 404 })
  @Put('tags/:tagId')
  async updateTag(
    @Req() req: AuthenticatedRequest,
    @Param('tagId') tagId: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<TagResponseDto> {
    return this.tagService.updateTag(req.user.id, tagId, updateTagDto);
  }

  @ApiOperation({ summary: 'Update track rating' })
  @ApiResponse({ description: 'Rating updated', status: 200 })
  @ApiResponse({ description: 'Track not found', status: 404 })
  @Put('tracks/:trackId/rating')
  async updateTrackRating(
    @Req() req: AuthenticatedRequest,
    @Param('trackId') trackId: string,
    @Body() updateRatingDto: UpdateRatingDto,
  ): Promise<{ message: string; rating: number }> {
    const rating = await this.trackService.updateTrackRating(
      req.user.id,
      trackId,
      updateRatingDto.rating,
    );
    return { message: 'Rating updated', rating };
  }
}
