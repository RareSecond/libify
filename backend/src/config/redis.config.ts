import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export const redisValidationSchema = Joi.object({
  REDIS_DB: Joi.number().default(0),
  REDIS_HOST: Joi.string().default("localhost"),
  REDIS_PASSWORD: Joi.string().optional().allow(""),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_TLS: Joi.boolean().default(false),
  REDIS_TLS_REJECT_UNAUTHORIZED: Joi.boolean().default(true),
  REDIS_URL: Joi.string().optional(),
});

export default registerAs("redis", () => ({
  db: parseInt(process.env.REDIS_DB || "0", 10),
  enableReadyCheck: false,
  host: process.env.REDIS_HOST || "localhost",
  // BullMQ specific options
  maxRetriesPerRequest: null,
  password: process.env.REDIS_PASSWORD,
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  tls: process.env.REDIS_TLS === "true",
}));
