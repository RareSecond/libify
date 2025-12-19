import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-custom";

import { DatabaseService } from "../../database/database.service";
import { ApiKeyService } from "../api-key.service";

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, "api-key") {
  constructor(
    private apiKeyService: ApiKeyService,
    private prisma: DatabaseService,
  ) {
    super();
  }

  async validate(request: Request) {
    // Extract API key from X-API-Key header or Authorization header
    const apiKey =
      request.headers["x-api-key"] ||
      this.extractFromAuthHeader(request.headers.authorization);

    if (!apiKey || typeof apiKey !== "string") {
      throw new UnauthorizedException("API key is required");
    }

    const validatedUser = await this.apiKeyService.validateApiKey(apiKey);

    if (!validatedUser) {
      throw new UnauthorizedException("Invalid API key");
    }

    // Fetch full user object
    const user = await this.prisma.user.findUnique({
      where: { id: validatedUser.id },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  private extractFromAuthHeader(header: string | undefined): null | string {
    if (!header) return null;

    // Support "Bearer sk_..." format
    if (header.startsWith("Bearer ")) {
      const token = header.substring(7);
      if (token.startsWith("sk_")) {
        return token;
      }
    }

    return null;
  }
}
