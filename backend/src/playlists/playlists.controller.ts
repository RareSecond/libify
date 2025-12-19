import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { User } from "@prisma/client";
import { Request } from "express";

import { CompositeAuthGuard } from "../auth/composite-auth.guard";
import { PaginatedTracksDto } from "../library/dto/track.dto";
import { PlaylistCriteriaDto } from "./dto/playlist-criteria.dto";
import {
  CreateSmartPlaylistDto,
  SmartPlaylistDto,
  SmartPlaylistWithTracksDto,
  SyncToSpotifyResponseDto,
  UpdateSmartPlaylistDto,
} from "./dto/smart-playlist.dto";
import { PlaylistsService } from "./playlists.service";

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiBearerAuth()
@ApiTags("playlists")
@Controller("playlists")
@UseGuards(CompositeAuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @ApiOperation({ summary: "Create a new smart playlist" })
  @ApiResponse({ status: 201, type: SmartPlaylistDto })
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createDto: CreateSmartPlaylistDto,
  ): Promise<SmartPlaylistDto> {
    const playlist = await this.playlistsService.create(req.user.id, createDto);
    return {
      ...playlist,
      criteria: playlist.criteria as unknown as PlaylistCriteriaDto,
    };
  }

  @ApiOperation({ summary: "Get all smart playlists" })
  @ApiResponse({ status: 200, type: [SmartPlaylistWithTracksDto] })
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
  ): Promise<SmartPlaylistWithTracksDto[]> {
    return this.playlistsService.findAll(req.user.id);
  }

  @ApiOperation({ summary: "Get a smart playlist by ID" })
  @ApiResponse({ status: 200, type: SmartPlaylistWithTracksDto })
  @Get(":id")
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ): Promise<SmartPlaylistWithTracksDto> {
    return this.playlistsService.findOne(req.user.id, id);
  }

  @ApiOperation({ summary: "Get tracks for a smart playlist" })
  @ApiQuery({
    description: "Page number for pagination (minimum: 1)",
    name: "page",
    required: false,
    type: Number,
  })
  @ApiQuery({
    description: "Number of items per page (minimum: 1, maximum: 100)",
    name: "pageSize",
    required: false,
    type: Number,
  })
  @ApiQuery({
    description:
      "Field to sort tracks by. If not provided, uses the playlist default order.",
    enum: [
      "title",
      "artist",
      "album",
      "duration",
      "totalPlayCount",
      "lastPlayedAt",
      "rating",
      "addedAt",
    ],
    name: "sortBy",
    required: false,
    type: String,
  })
  @ApiQuery({
    description: "Sort direction (ascending or descending)",
    enum: ["asc", "desc"],
    name: "sortOrder",
    required: false,
    type: String,
  })
  @ApiResponse({ status: 200, type: PaginatedTracksDto })
  @Get(":id/tracks")
  async getTracks(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("pageSize", new DefaultValuePipe(20), ParseIntPipe)
    pageSize: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ): Promise<PaginatedTracksDto> {
    // Validate pagination parameters
    if (page < 1) {
      throw new BadRequestException("Page must be at least 1");
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new BadRequestException("Page size must be between 1 and 100");
    }

    // Validate sortOrder to prevent invalid values from being passed
    let normalizedSortOrder: "asc" | "desc" | undefined;
    if (sortOrder === "asc") {
      normalizedSortOrder = "asc";
    } else if (sortOrder === "desc") {
      normalizedSortOrder = "desc";
    } else {
      normalizedSortOrder = undefined;
    }

    return this.playlistsService.getTracks(
      req.user.id,
      id,
      page,
      pageSize,
      sortBy,
      normalizedSortOrder,
    );
  }

  @ApiOperation({ summary: "Get all track URIs for playing a playlist" })
  @ApiQuery({
    description: "Shuffle the tracks",
    name: "shuffle",
    required: false,
    type: Boolean,
  })
  @ApiResponse({ status: 200, type: [String] })
  @Get(":id/tracks/play")
  async getTracksForPlay(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Query("shuffle", new DefaultValuePipe(false), ParseBoolPipe)
    shuffle: boolean,
  ): Promise<string[]> {
    return this.playlistsService.getTracksForPlay(req.user.id, id, shuffle);
  }

  @ApiOperation({ summary: "Delete a smart playlist" })
  @ApiResponse({ status: 204 })
  @Delete(":id")
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ): Promise<void> {
    await this.playlistsService.remove(req.user.id, id);
  }

  @ApiOperation({
    description:
      "Syncs the smart playlist to Spotify. Creates a new Spotify playlist if one doesn't exist, or updates the existing one. The Spotify playlist name will be prefixed with [Codex.fm].",
    summary: "Sync smart playlist to Spotify",
  })
  @ApiResponse({ status: 200, type: SyncToSpotifyResponseDto })
  @Post(":id/sync")
  async syncToSpotify(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ): Promise<SyncToSpotifyResponseDto> {
    return this.playlistsService.syncToSpotify(req.user.id, id);
  }

  @ApiOperation({ summary: "Update a smart playlist" })
  @ApiResponse({ status: 200, type: SmartPlaylistDto })
  @Put(":id")
  async update(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() updateDto: UpdateSmartPlaylistDto,
  ): Promise<SmartPlaylistDto> {
    const playlist = await this.playlistsService.update(
      req.user.id,
      id,
      updateDto,
    );
    return {
      ...playlist,
      criteria: playlist.criteria as unknown as PlaylistCriteriaDto,
    };
  }
}
