import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { UserDto } from './dto/user.dto';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly cookieOptions = {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: this.isProduction,
    ...(this.isProduction &&
      process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
  };

  constructor(private authService: AuthService) {}

  @Get('token')
  @UseGuards(AuthGuard('jwt'))
  async getAccessToken(@Req() req: AuthenticatedRequest) {
    const accessToken = await this.authService.getSpotifyAccessToken(
      req.user.id,
    );
    return { accessToken };
  }

  @ApiResponse({ description: 'User profile', status: 200, type: UserDto })
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: AuthenticatedRequest): UserDto {
    return plainToInstance(UserDto, req.user, {
      excludeExtraneousValues: true,
    });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('jwt', this.cookieOptions);
    res.json({ message: 'Logged out successfully' });
  }

  @Get('spotify')
  @UseGuards(AuthGuard('spotify'))
  async spotifyAuth(@Req() _req: Request) {
    // This will redirect to Spotify OAuth
  }

  @Get('spotify/callback')
  @UseGuards(AuthGuard('spotify'))
  async spotifyCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const user = req.user;
    const loginResult = await this.authService.login(user);

    res.cookie('jwt', loginResult.access_token, {
      ...this.cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
  }
}
