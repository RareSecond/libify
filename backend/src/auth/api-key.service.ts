import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";

import { DatabaseService } from "../database/database.service";

@Injectable()
export class ApiKeyService {
  private readonly secret: string;

  constructor(private prisma: DatabaseService) {
    const secret = process.env.API_KEY_SECRET;
    if (!secret) {
      throw new Error("API_KEY_SECRET environment variable is required");
    }
    this.secret = secret;
  }

  /**
   * Generate an API key for a user.
   * Format: sk_<base64url(userId)>_<signature>
   * The userId is embedded so we can validate without DB lookup.
   */
  generateApiKey(userId: string): string {
    const userIdEncoded = Buffer.from(userId).toString("base64url");
    const signature = this.signUserId(userId);

    return `sk_${userIdEncoded}_${signature}`;
  }

  /**
   * Validate an API key and return the associated user if valid.
   * O(1) - no database iteration needed for validation itself.
   */
  async validateApiKey(apiKey: string): Promise<null | { id: string }> {
    // Quick format check
    if (!apiKey || !apiKey.startsWith("sk_")) {
      return null;
    }

    // Parse the key: sk_<userIdEncoded>_<signature>
    const parts = apiKey.split("_");
    if (parts.length !== 3) {
      return null;
    }

    const [, userIdEncoded, providedSignature] = parts;

    // Decode the userId
    let userId: string;
    try {
      userId = Buffer.from(userIdEncoded, "base64url").toString("utf8");
    } catch {
      return null;
    }

    // Verify the signature using timing-safe comparison
    const expectedSignature = this.signUserId(userId);
    const providedBuffer = Buffer.from(providedSignature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (providedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }

    // Verify user exists in database
    const user = await this.prisma.user.findUnique({
      select: { id: true },
      where: { id: userId },
    });

    return user;
  }

  private signUserId(userId: string): string {
    const hmac = createHmac("sha256", this.secret);
    hmac.update(userId);
    // Use first 16 chars of hex (64 bits) - sufficient for security
    return hmac.digest("hex").substring(0, 16);
  }
}
