import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: DatabaseService,
  ) {}

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateUser(
    email: string,
    name: string,
    provider: string,
    providerId: string,
  ): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          provider,
          providerId,
          ...(provider === 'spotify' && { spotifyId: providerId }),
        },
      });
    }

    return user;
  }
}
