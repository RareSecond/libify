import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { User } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { Request } from "express";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentPlaybackStateDto } from "./dto/current-playback.dto";
import { PlayContextDto } from "./dto/play-context.dto";
import {
  PlaybackControlResponseDto,
  PlaybackResponseDto,
} from "./dto/playback-response.dto";
import { TransferPlaybackDto } from "./dto/transfer-playback.dto";
import { PlaybackService } from "./playback.service";

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiBearerAuth()
@ApiTags("playback")
@Controller("playback")
@UseGuards(JwtAuthGuard)
export class PlaybackController {
  private readonly logger = new Logger(PlaybackController.name);

  constructor(private readonly playbackService: PlaybackService) {}

  @ApiOperation({ summary: "Get current playback state" })
  @ApiResponse({
    description: "Current playback state",
    status: 200,
    type: CurrentPlaybackStateDto,
  })
  @ApiResponse({ description: "No active playback", status: 204 })
  @Get("current")
  async getCurrentPlayback(
    @Req() req: AuthenticatedRequest,
  ): Promise<CurrentPlaybackStateDto | null> {
    try {
      const result = await this.playbackService.getCurrentPlayback(req.user.id);
      return result;
    } catch (error) {
      this.logger.error("Failed to get current playback", error);
      throw new HttpException(
        error.message || "Failed to get current playback",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: "Skip to next track" })
  @ApiResponse({
    description: "Skipped to next track",
    status: 200,
    type: PlaybackControlResponseDto,
  })
  @ApiResponse({ description: "Bad request", status: 400 })
  @Post("next")
  async next(
    @Req() req: AuthenticatedRequest,
  ): Promise<PlaybackControlResponseDto> {
    try {
      const result = await this.playbackService.next(req.user.id);

      return plainToInstance(PlaybackControlResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error("Failed to skip to next track", error);
      throw new HttpException(
        error.message || "Failed to skip to next track",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: "Pause playback" })
  @ApiResponse({
    description: "Playback paused",
    status: 200,
    type: PlaybackControlResponseDto,
  })
  @ApiResponse({ description: "Bad request", status: 400 })
  @Post("pause")
  async pause(
    @Req() req: AuthenticatedRequest,
  ): Promise<PlaybackControlResponseDto> {
    try {
      const result = await this.playbackService.pause(req.user.id);

      return plainToInstance(PlaybackControlResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error("Failed to pause playback", error);
      throw new HttpException(
        error.message || "Failed to pause playback",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: "Start playback with queue generation" })
  @ApiResponse({
    description: "Playback started successfully",
    status: 200,
    type: PlaybackResponseDto,
  })
  @ApiResponse({ description: "Bad request", status: 400 })
  @ApiResponse({ description: "Unauthorized", status: 401 })
  @Post("play")
  async play(
    @Req() req: AuthenticatedRequest,
    @Body() playContext: PlayContextDto,
  ): Promise<PlaybackResponseDto> {
    try {
      const result = await this.playbackService.play(req.user.id, playContext);

      return plainToInstance(PlaybackResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error("Failed to start playback", error);
      throw new HttpException(
        error.message || "Failed to start playback",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: "Resume playback" })
  @ApiResponse({
    description: "Playback resumed",
    status: 200,
    type: PlaybackControlResponseDto,
  })
  @ApiResponse({ description: "Bad request", status: 400 })
  @Post("resume")
  async resume(
    @Req() req: AuthenticatedRequest,
  ): Promise<PlaybackControlResponseDto> {
    try {
      const result = await this.playbackService.resume(req.user.id);

      return plainToInstance(PlaybackControlResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error("Failed to resume playback", error);
      throw new HttpException(
        error.message || "Failed to resume playback",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @ApiOperation({ summary: "Transfer playback to a device" })
  @ApiResponse({
    description: "Playback transferred",
    status: 200,
    type: PlaybackControlResponseDto,
  })
  @ApiResponse({ description: "Bad request", status: 400 })
  @Post("transfer")
  async transferPlayback(
    @Req() req: AuthenticatedRequest,
    @Body() transferDto: TransferPlaybackDto,
  ): Promise<PlaybackControlResponseDto> {
    try {
      const result = await this.playbackService.transferPlayback(
        req.user.id,
        transferDto.deviceId,
      );

      return plainToInstance(PlaybackControlResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error("Failed to transfer playback", error);
      throw new HttpException(
        error.message || "Failed to transfer playback",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
