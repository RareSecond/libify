import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { UserDto } from './dto/auth.dto';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
    res.clearCookie('jwt', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: false,
    });
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
    
    // Set JWT as HTTP-only cookie
    res.cookie('jwt', loginResult.access_token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      sameSite: 'lax',
      secure: false,
    });

    // Redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
  }
}
