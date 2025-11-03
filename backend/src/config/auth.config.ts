import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export interface AuthConfigType {
  jwtExpiresIn: string;
  jwtSecret: string;
}

export const authValidationSchema = Joi.object({
  ENCRYPTION_KEY: Joi.string()
    .hex()
    .min(64)
    .required()
    .custom((value, helpers) => {
      // Check for basic entropy (not just repeated characters)
      const uniqueChars = new Set(value).size;
      if (uniqueChars < 8) {
        return helpers.error("string.lowEntropy");
      }
      return value;
    })
    .messages({
      "any.required":
        "ENCRYPTION_KEY environment variable is required. Generate using: openssl rand -hex 32",
      "string.hex": "ENCRYPTION_KEY must be a hexadecimal string",
      "string.lowEntropy":
        "ENCRYPTION_KEY appears to have low entropy. Use a cryptographically secure random key",
      "string.min":
        "ENCRYPTION_KEY must be at least 64 characters (32 bytes in hex)",
    }),
  JWT_EXPIRES_IN: Joi.string().default("24h"),
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .invalid("your-secret-key", "secret", "default", "jwt-secret")
    .custom((value, helpers) => {
      // Check for basic entropy (not just repeated characters)
      const uniqueChars = new Set(value).size;
      if (uniqueChars < 8) {
        return helpers.error("string.lowEntropy");
      }
      return value;
    })
    .messages({
      "any.invalid":
        "JWT_SECRET cannot be a common default value. Use a cryptographically secure random string",
      "any.required": "JWT_SECRET environment variable is required",
      "string.lowEntropy":
        "JWT_SECRET appears to have low entropy (too many repeated characters). Use a more random secret string",
      "string.min":
        "JWT_SECRET must be at least 32 characters long for security",
    }),
});

export default registerAs("auth", (): AuthConfigType => {
  return {
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    jwtSecret: process.env.JWT_SECRET,
  };
});
