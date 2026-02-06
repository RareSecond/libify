import {
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
import { plainToInstance } from "class-transformer";
import { Request } from "express";

import { AdminGuard } from "../auth/admin.guard";
import { AuthService } from "../auth/auth.service";
import { CompositeAuthGuard } from "../auth/composite-auth.guard";
import { AudioFeaturesQueueService } from "../library/audio-features-queue.service";
import { GenreEnrichmentService } from "../library/genre-enrichment.service";
import { GenreQueueService } from "../library/genre-queue.service";
import { LibrarySyncService } from "../library/library-sync.service";
import {
  BackfillStatusDto,
  BackfillTriggerResponseDto,
  CombinedBackfillStatusDto,
} from "./dto/backfill-status.dto";

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@ApiBearerAuth()
@ApiTags("admin")
@Controller("admin")
@UseGuards(CompositeAuthGuard, AdminGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly librarySyncService: LibrarySyncService,
    private readonly genreEnrichmentService: GenreEnrichmentService,
    private readonly genreQueueService: GenreQueueService,
    private readonly audioFeaturesQueueService: AudioFeaturesQueueService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({
    summary: "Get backfill status for audio features and genres",
  })
  @ApiResponse({
    description: "Backfill status retrieved",
    status: 200,
    type: CombinedBackfillStatusDto,
  })
  @Get("backfill/status")
  async getBackfillStatus(): Promise<CombinedBackfillStatusDto> {
    const [audioFeaturesStatus, genresStatus] = await Promise.all([
      this.librarySyncService.getAudioFeaturesBackfillStatus(),
      this.genreEnrichmentService.getGenreBackfillStatus(),
    ]);

    const audioFeatures = plainToInstance(
      BackfillStatusDto,
      {
        ...audioFeaturesStatus,
        percentComplete:
          audioFeaturesStatus.total > 0
            ? Math.round(
                (audioFeaturesStatus.completed / audioFeaturesStatus.total) *
                  100,
              )
            : 100,
      },
      { excludeExtraneousValues: true },
    );

    const genres = plainToInstance(
      BackfillStatusDto,
      {
        ...genresStatus,
        percentComplete:
          genresStatus.total > 0
            ? Math.round((genresStatus.completed / genresStatus.total) * 100)
            : 100,
      },
      { excludeExtraneousValues: true },
    );

    return plainToInstance(
      CombinedBackfillStatusDto,
      { audioFeatures, genres },
      { excludeExtraneousValues: true },
    );
  }

  @ApiOperation({ summary: "Reset all genre data to allow fresh re-import" })
  @ApiResponse({
    description: "All genre data has been reset",
    status: 200,
    type: BackfillTriggerResponseDto,
  })
  @Post("backfill/genres/reset")
  async resetGenres(): Promise<BackfillTriggerResponseDto> {
    try {
      this.logger.log("Admin triggered genre reset");

      const result = await this.genreEnrichmentService.resetAllGenres();

      return plainToInstance(
        BackfillTriggerResponseDto,
        {
          message: `Genre data reset for ${result.tracksReset} tracks. You can now run a fresh genre backfill.`,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error("Failed to reset genres", error);
      throw new HttpException(
        "Failed to reset genre data",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: "Backfill album release dates from Spotify" })
  @ApiResponse({
    description: "Album release date backfill started",
    status: 200,
    type: BackfillTriggerResponseDto,
  })
  @ApiResponse({
    description: "Album release date backfill already in progress",
    status: 409,
  })
  @Post("backfill/album-release-dates")
  async triggerAlbumReleaseDateBackfill(
    @Req() req: AuthenticatedRequest,
  ): Promise<BackfillTriggerResponseDto> {
    if (this.librarySyncService.isAlbumReleaseDateBackfillInProgress()) {
      throw new HttpException(
        "Album release date backfill is already in progress. Please wait for it to complete.",
        HttpStatus.CONFLICT,
      );
    }

    try {
      this.logger.log("Admin triggered album release date backfill");

      const accessToken = await this.authService.getSpotifyAccessToken(
        req.user.id,
      );

      if (!accessToken) {
        throw new HttpException(
          "Could not obtain Spotify access token",
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Run in background
      this.librarySyncService
        .backfillAlbumReleaseDates(accessToken, (processed, total) => {
          this.logger.log(
            `Album release date backfill progress: ${processed}/${total}`,
          );
        })
        .then((result) => {
          this.logger.log(
            `Album release date backfill completed: ${result.totalUpdated}/${result.totalProcessed} updated`,
          );
        })
        .catch((error) => {
          this.logger.error("Album release date backfill failed", error);
        });

      const pendingCount =
        await this.librarySyncService.getAlbumReleaseDateBackfillCount();

      return plainToInstance(
        BackfillTriggerResponseDto,
        {
          message: `Album release date backfill started for ${pendingCount} albums`,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error("Failed to start album release date backfill", error);
      throw new HttpException(
        "Failed to start album release date backfill",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: "Trigger both audio features and genre backfill" })
  @ApiResponse({
    description: "Both backfill jobs started",
    status: 200,
    type: BackfillTriggerResponseDto,
  })
  @Post("backfill/all")
  async triggerAllBackfills(): Promise<BackfillTriggerResponseDto> {
    try {
      this.logger.log("Admin triggered all backfills");

      // Enqueue audio features backfill job
      await this.audioFeaturesQueueService.enqueueBackfill();

      // Enqueue genre backfill job
      await this.genreQueueService.enqueueBackfill();

      const [audioStatus, genreStatus] = await Promise.all([
        this.librarySyncService.getAudioFeaturesBackfillStatus(),
        this.genreEnrichmentService.getGenreBackfillStatus(),
      ]);

      return plainToInstance(
        BackfillTriggerResponseDto,
        {
          message: `Backfills started: ${audioStatus.pending} tracks for audio features, ${genreStatus.pending} tracks for genres`,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error("Failed to start backfills", error);
      throw new HttpException(
        "Failed to start backfills",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: "Trigger audio features backfill for all tracks" })
  @ApiResponse({
    description: "Audio features backfill started",
    status: 200,
    type: BackfillTriggerResponseDto,
  })
  @Post("backfill/audio-features")
  async triggerAudioFeaturesBackfill(): Promise<BackfillTriggerResponseDto> {
    try {
      this.logger.log("Admin triggered global audio features backfill");

      await this.audioFeaturesQueueService.enqueueBackfill();

      const status =
        await this.librarySyncService.getAudioFeaturesBackfillStatus();

      return plainToInstance(
        BackfillTriggerResponseDto,
        {
          message: `Audio features backfill started for ${status.pending} tracks`,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error("Failed to start audio features backfill", error);
      throw new HttpException(
        "Failed to start audio features backfill",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: "Trigger genre backfill for all tracks" })
  @ApiResponse({
    description: "Genre backfill job enqueued",
    status: 200,
    type: BackfillTriggerResponseDto,
  })
  @Post("backfill/genres")
  async triggerGenreBackfill(): Promise<BackfillTriggerResponseDto> {
    try {
      this.logger.log("Admin triggered global genre backfill");

      await this.genreQueueService.enqueueBackfill();

      const status = await this.genreEnrichmentService.getGenreBackfillStatus();

      return plainToInstance(
        BackfillTriggerResponseDto,
        {
          jobId: "backfill",
          message: `Genre backfill job enqueued for ${status.pending} tracks`,
        },
        { excludeExtraneousValues: true },
      );
    } catch (error) {
      this.logger.error("Failed to enqueue genre backfill", error);
      throw new HttpException(
        "Failed to enqueue genre backfill",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
