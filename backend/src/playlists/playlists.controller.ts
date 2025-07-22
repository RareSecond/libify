import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateSmartPlaylistDto,
  SmartPlaylistDto,
  SmartPlaylistWithTracksDto,
  UpdateSmartPlaylistDto,
} from './dto/smart-playlist.dto';
import { PlaylistsService } from './playlists.service';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiBearerAuth()
@ApiTags('playlists')
@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @ApiOperation({ summary: 'Create a new smart playlist' })
  @ApiResponse({ status: 201, type: SmartPlaylistDto })
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateSmartPlaylistDto,
  ): Promise<SmartPlaylistDto> {
    const playlist = await this.playlistsService.create(req.user.id, createDto);
    return {
      ...playlist,
      criteria: playlist.criteria as any,
    };
  }

  @ApiOperation({ summary: 'Get all smart playlists' })
  @ApiResponse({ status: 200, type: [SmartPlaylistWithTracksDto] })
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
  ): Promise<SmartPlaylistWithTracksDto[]> {
    return this.playlistsService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get a smart playlist by ID' })
  @ApiResponse({ status: 200, type: SmartPlaylistWithTracksDto })
  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<SmartPlaylistWithTracksDto> {
    return this.playlistsService.findOne(req.user.id, id);
  }

  @ApiOperation({ summary: 'Get tracks for a smart playlist' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @Get(':id/tracks')
  async getTracks(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.playlistsService.getTracks(
      req.user.id,
      id,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  @ApiOperation({ summary: 'Delete a smart playlist' })
  @ApiResponse({ status: 204 })
  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<void> {
    await this.playlistsService.remove(req.user.id, id);
  }

  @ApiOperation({ summary: 'Update a smart playlist' })
  @ApiResponse({ status: 200, type: SmartPlaylistDto })
  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateDto: UpdateSmartPlaylistDto,
  ): Promise<SmartPlaylistDto> {
    const playlist = await this.playlistsService.update(
      req.user.id,
      id,
      updateDto,
    );
    return {
      ...playlist,
      criteria: playlist.criteria as any,
    };
  }
}
