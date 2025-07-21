import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
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
import { Request } from 'express';

import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetTracksQueryDto, PaginatedTracksDto } from './dto/track.dto';
import { LibrarySyncService } from './library-sync.service';
import { TrackService } from './track.service';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiBearerAuth()
@ApiTags('library')
@Controller('library')
@UseGuards(JwtAuthGuard)
export class LibraryController {
  constructor(
    private librarySyncService: LibrarySyncService,
    private authService: AuthService,
    private trackService: TrackService,
  ) {}

  @ApiOperation({ summary: 'Get library sync status' })
  @ApiResponse({ description: 'Sync status retrieved', status: 200 })
  @Get('sync/status')
  async getSyncStatus(@Req() req: AuthenticatedRequest) {
    const status = await this.librarySyncService.getSyncStatus(req.user.id);
    return status;
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
    return this.trackService.getUserTracks(req.user.id, query);
  }

  @ApiOperation({ summary: 'Sync user library from Spotify' })
  @ApiResponse({ description: 'Library sync completed', status: 200 })
  @ApiResponse({ description: 'Unauthorized', status: 401 })
  @ApiResponse({ description: 'Internal server error', status: 500 })
  @Post('sync')
  async syncLibrary(@Req() req: AuthenticatedRequest) {
    try {
      // Get fresh access token
      const accessToken = await this.authService.getSpotifyAccessToken(
        req.user.id,
      );

      if (!accessToken) {
        throw new HttpException(
          'Spotify access token not found. Please re-authenticate.',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.librarySyncService.syncUserLibrary(
        req.user.id,
        accessToken,
      );

      return {
        message: 'Library sync completed',
        result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to sync library',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Sync recently played tracks from Spotify' })
  @ApiResponse({ description: 'Recently played tracks synced', status: 200 })
  @ApiResponse({ description: 'Unauthorized', status: 401 })
  @Post('sync/recent')
  async syncRecentlyPlayed(@Req() req: AuthenticatedRequest) {
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

      await this.librarySyncService.syncRecentlyPlayed(
        req.user.id,
        accessToken,
      );

      return {
        message: 'Recently played tracks synced successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to sync recently played tracks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

